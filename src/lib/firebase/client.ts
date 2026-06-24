"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Client-side Firebase is intentionally minimal: it exists only to run
 * the Google Sign-In popup and mint an ID token. Firestore is never
 * touched from the browser — every read/write goes through our own
 * API routes using firebase-admin (see lib/firebase/admin.ts), so the
 * Firestore client SDK isn't even installed.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

/**
 * Identity-only scopes. This is deliberately NOT where we ask for Gmail
 * access — that's a separate incremental OAuth grant per connected
 * inbox, started from /api/gmail/connect, so a user's "login" account
 * and their "monitored" inboxes can be different Google accounts.
 */
export const googleSignInProvider = new GoogleAuthProvider();
googleSignInProvider.setCustomParameters({ prompt: "select_account" });
