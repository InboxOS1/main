import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { syncAccountEmails } from "@/lib/google/gmail";
import type { ConnectedAccount } from "@/lib/types";

// Gmail fetch only — classification happens in separate /api/analyze
// call(s) kicked off by the client right after this resolves, so the two
// don't compete for the same time budget and blow the function timeout.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { accountId, all } = await request.json().catch(() => ({}));

  let accounts: ConnectedAccount[] = [];
  if (all) {
    const snap = await db.collection(COLLECTIONS.connectedAccounts).where("uid", "==", uid).get();
    accounts = snap.docs.map((d) => d.data() as ConnectedAccount);
  } else if (accountId) {
    const snap = await db.collection(COLLECTIONS.connectedAccounts).doc(accountId).get();
    if (snap.exists && (snap.data() as ConnectedAccount).uid === uid) {
      accounts = [snap.data() as ConnectedAccount];
    }
  }

  if (accounts.length === 0) {
    return NextResponse.json({ error: "No matching connected account(s)." }, { status: 404 });
  }

  let totalNewEmails = 0;
  let accountsSynced = 0;
  const errors: string[] = [];

  for (const account of accounts) {
    try {
      const newIds = await syncAccountEmails(account);
      totalNewEmails += newIds.length;
      accountsSynced++;
    } catch (err) {
      errors.push(`${account.email}: ${err instanceof Error ? err.message : "sync failed"}`);
    }
  }

  return NextResponse.json({
    newEmails: totalNewEmails,
    accountsSynced,
    errors,
  });
}