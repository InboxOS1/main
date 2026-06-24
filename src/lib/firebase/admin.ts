import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only. Never import this file from a "use client" component —
 * it requires the service account private key.
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (see .env.example)."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const db = getFirestore(adminApp);

// Firestore collection name constants, kept in one place to avoid typos.
export const COLLECTIONS = {
  users: "users",
  connectedAccounts: "connectedAccounts",
  emails: "emails",
  analysis: "analysis",
  contacts: "contacts",
  dailyBriefs: "dailyBriefs",
} as const;
