import { NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { analyzeUnanalyzedEmails } from "@/lib/ai/classify";

export const maxDuration = 60;

export async function POST() {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await analyzeUnanalyzedEmails(uid);
  return NextResponse.json(result);
}
