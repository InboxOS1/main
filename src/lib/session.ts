import "server-only";
import { cookies } from "next/headers";
import { adminAuth, db, COLLECTIONS } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/constants";
import type { InboxUser } from "@/lib/types";

/** Exchanges a freshly-minted Firebase ID token for a long-lived, httpOnly session cookie. */
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_SECONDS * 1000,
  });
}

/** Verifies the session cookie from the current request and returns the decoded claims, or null. */
export async function getSessionClaims() {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    return await adminAuth.verifySessionCookie(cookie, true);
  } catch {
    return null;
  }
}

/** Returns the signed-in InboxOS user (from Firestore `users/{uid}`), creating the doc on first login. */
export async function getCurrentUser(): Promise<InboxUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const ref = db.collection(COLLECTIONS.users).doc(claims.uid);
  const snap = await ref.get();

  if (snap.exists) {
    return snap.data() as InboxUser;
  }

  const newUser: InboxUser = {
    uid: claims.uid,
    name: (claims.name as string) || claims.email?.split("@")[0] || "Founder",
    email: claims.email || "",
    photoURL: (claims.picture as string) || null,
    plan: "free",
    createdAt: Date.now(),
  };
  await ref.set(newUser);
  return newUser;
}

export async function requireUid(): Promise<string> {
  const claims = await getSessionClaims();
  if (!claims) throw new SessionError("Not signed in.");
  return claims.uid;
}

export class SessionError extends Error {}
