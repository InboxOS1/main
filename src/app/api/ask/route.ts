import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { askInbox } from "@/lib/ai/askInbox";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { question } = await request.json().catch(() => ({ question: null }));
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Keep questions under 500 characters." }, { status: 400 });
  }

  const result = await askInbox(uid, question.trim());
  return NextResponse.json(result);
}
