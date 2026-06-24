import { NextRequest, NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { exchangeCodeForTokens, fetchGoogleProfile } from "@/lib/google/oauth";
import { verifyState, encryptSecret } from "@/lib/crypto";
import { syncAccountEmails } from "@/lib/google/gmail";
import { analyzeUnanalyzedEmails } from "@/lib/ai/classify";
import type { ConnectedAccount } from "@/lib/types";

function redirectToAccounts(req: NextRequest, params: Record<string, string> = {}) {
  const url = new URL("/dashboard/accounts", process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return redirectToAccounts(request, { error: `Google declined: ${oauthError}` });
  }
  if (!code || !state) {
    return redirectToAccounts(request, { error: "Missing code or state from Google." });
  }

  let uid: string;
  try {
    ({ uid } = verifyState<{ uid: string }>(state));
  } catch (err) {
    return redirectToAccounts(request, { error: err instanceof Error ? err.message : "Invalid state." });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokens.access_token!);

    const accountId = `${uid}_${Buffer.from(profile.email).toString("base64url")}`;
    const account: ConnectedAccount = {
      accountId,
      uid,
      email: profile.email,
      displayName: profile.name,
      photoURL: profile.photoURL,
      accessToken: encryptSecret(tokens.access_token!),
      refreshToken: encryptSecret(tokens.refresh_token!),
      accessTokenExpiresAt: tokens.expiry_date ?? null,
      connectedAt: Date.now(),
      lastSync: null,
      status: "connected",
      lastError: null,
    };

    await db.collection(COLLECTIONS.connectedAccounts).doc(accountId).set(account, { merge: true });

    // Kick off the first sync + analysis pass inline. For very large
    // inboxes this can approach a serverless function's time limit;
    // the account will simply pick up the rest on its next manual
    // sync or the next cron-driven analyze pass.
    try {
      await syncAccountEmails(account);
      await analyzeUnanalyzedEmails(uid);
    } catch (syncErr) {
      console.error("Initial sync failed (account is still connected):", syncErr);
    }

    return redirectToAccounts(request, { connected: profile.email });
  } catch (err) {
    return redirectToAccounts(request, {
      error: err instanceof Error ? err.message : "Could not connect this inbox.",
    });
  }
}
