import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { db, COLLECTIONS } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { accountId } = await request.json().catch(() => ({ accountId: null }));
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "Missing accountId." }, { status: 400 });
  }

  const ref = db.collection(COLLECTIONS.connectedAccounts).doc(accountId);
  const snap = await ref.get();
  if (!snap.exists || (snap.data() as { uid: string }).uid !== uid) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // We intentionally don't delete the email/analysis history on
  // disconnect — re-connecting the same inbox should not require
  // re-analyzing everything. Delete the connectedAccounts doc only.
  await ref.delete();

  return NextResponse.json({ ok: true });
}
