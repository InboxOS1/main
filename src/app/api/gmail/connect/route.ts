import { NextRequest, NextResponse } from "next/server";
import { requireUid } from "@/lib/session";
import { buildGmailConsentUrl } from "@/lib/google/oauth";
import { signState } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    uid = await requireUid();
  } catch {
    return NextResponse.redirect(new URL("/?signin=1", request.nextUrl.origin));
  }

  const state = signState({ uid, nonce: crypto.randomUUID() });
  const consentUrl = buildGmailConsentUrl(state);
  return NextResponse.redirect(consentUrl);
}
