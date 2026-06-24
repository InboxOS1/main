import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("signin", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Cheap presence check only — middleware runs on the Edge runtime and
// can't call firebase-admin. Real verification (signature, expiry,
// revocation) happens in getCurrentUser() inside the dashboard layout.
export const config = {
  matcher: ["/dashboard/:path*"],
};
