import { NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { refreshContacts } from "@/lib/contacts/intelligence";

export const maxDuration = 60;

export async function POST() {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await refreshContacts(uid);
  return NextResponse.json(result);
}
