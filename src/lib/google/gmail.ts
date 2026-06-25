import "server-only";
import { google, gmail_v1 } from "googleapis";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { oauthClientFromRefreshToken } from "@/lib/google/oauth";
import { EMAILS_PER_ACCOUNT_SYNC } from "@/lib/constants";
import type { ConnectedAccount, InboxEmail } from "@/lib/types";

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

/** Walks a Gmail message payload (which can be deeply nested multipart) for the best plain-text body. */
function extractPlainTextBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts?.length) {
    // Prefer text/plain; fall back to stripped text/html if that's all there is.
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractPlainTextBody(part);
      if (nested) return nested;
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data)
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const header = message.payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value ?? "";
}

function parseSender(fromHeader: string): { name: string; email: string } {
  const match = fromHeader.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const rawName = match[1] ?? "";
    const rawEmail = (match[2] ?? "").trim().toLowerCase();
    return { name: rawName.replace(/"/g, "").trim() || rawEmail, email: rawEmail };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim().toLowerCase() };
}

async function gmailClientFor(account: ConnectedAccount) {
  const refreshToken = decryptSecret(account.refreshToken);
  const oauth2Client = oauthClientFromRefreshToken(refreshToken);

  // Proactively refresh so we can persist the new access token and
  // surface revocation (e.g. user removed InboxOS's access in their
  // Google Account) as a clear "needs_reauth" status instead of a
  // confusing downstream Gmail API error.
  try {
    await oauth2Client.getAccessToken(); // refreshes + updates oauth2Client.credentials internally
    const { access_token, expiry_date } = oauth2Client.credentials;
    if (access_token) {
      await db
        .collection(COLLECTIONS.connectedAccounts)
        .doc(account.accountId)
        .update({
          accessToken: encryptSecret(access_token),
          accessTokenExpiresAt: expiry_date ?? null,
          status: "connected",
          lastError: null,
        });
    }
  } catch (err) {
    await db.collection(COLLECTIONS.connectedAccounts).doc(account.accountId).update({
      status: "needs_reauth",
      lastError: err instanceof Error ? err.message : "Token refresh failed.",
    });
    throw new Error(`Reconnect required for ${account.email}: token refresh failed.`);
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Pulls up to EMAILS_PER_ACCOUNT_SYNC recent messages for a connected
 * account and upserts them into Firestore. Returns the new emailIds so
 * the caller can immediately queue them for Gemini analysis.
 */
export async function syncAccountEmails(account: ConnectedAccount): Promise<string[]> {
  const gmail = await gmailClientFor(account);
  const newEmailIds: string[] = [];

  let pageToken: string | undefined;
  let fetched = 0;

  await db.collection(COLLECTIONS.connectedAccounts).doc(account.accountId).update({ status: "syncing" });

  try {
    while (fetched < EMAILS_PER_ACCOUNT_SYNC) {
      const pageSize = Math.min(100, EMAILS_PER_ACCOUNT_SYNC - fetched);
      const list = await gmail.users.messages.list({
        userId: "me",
        maxResults: pageSize,
        pageToken,
        q: "in:inbox -in:chats",
      });

      const ids = list.data.messages ?? [];
      if (ids.length === 0) break;

      // Batch-fetch full messages. Gmail has no native batch-get in v1 REST
      // without the batch endpoint, so we parallelize with a small fan-out.
      const chunks = await Promise.all(
        ids.map((m) =>
          gmail.users.messages.get({ userId: "me", id: m.id!, format: "full" }).then((r) => r.data)
        )
      );

      const batch = db.batch();
      for (const message of chunks) {
        if (!message.id) continue;
        const docId = `${account.accountId}_${message.id}`;
        const { name, email } = parseSender(getHeader(message, "From"));
        const dateHeader = getHeader(message, "Date");
        const timestamp = message.internalDate
          ? Number(message.internalDate)
          : dateHeader
            ? new Date(dateHeader).getTime()
            : Date.now();

        const emailDoc: InboxEmail = {
          emailId: docId,
          uid: account.uid,
          accountId: account.accountId,
          accountEmail: account.email,
          sender: name,
          senderEmail: email,
          subject: getHeader(message, "Subject") || "(no subject)",
          body: extractPlainTextBody(message.payload).slice(0, 6000),
          snippet: message.snippet ?? "",
          timestamp,
          labels: message.labelIds ?? [],
          threadId: message.threadId ?? message.id,
        };

        batch.set(db.collection(COLLECTIONS.emails).doc(docId), emailDoc, { merge: true });
        newEmailIds.push(docId);
      }
      await batch.commit();

      fetched += ids.length;
      pageToken = list.data.nextPageToken ?? undefined;
      if (!pageToken) break;
    }

    await db.collection(COLLECTIONS.connectedAccounts).doc(account.accountId).update({
      lastSync: Date.now(),
      status: "connected",
      lastError: null,
    });
  } catch (err) {
    await db.collection(COLLECTIONS.connectedAccounts).doc(account.accountId).update({
      status: "error",
      lastError: err instanceof Error ? err.message : "Sync failed.",
    });
    throw err;
  }

  return newEmailIds;
}
