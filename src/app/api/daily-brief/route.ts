import { NextResponse } from "next/server";
import { requireUid, getCurrentUser } from "@/lib/session";
import { generateDailyBrief } from "@/lib/ai/dailyBrief";

export const maxDuration = 60;

export async function POST() {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await getCurrentUser();
  const brief = await generateDailyBrief(uid, user);
  return NextResponse.json(brief);
}
