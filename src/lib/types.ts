/**
 * Shared types for InboxOS, mirroring the Firestore schema from the
 * product spec — with two deliberate additions:
 *  - `uid` is denormalized onto Email/Analysis/ConnectedAccount docs.
 *  - Token fields are stored encrypted (see lib/crypto.ts) and typed
 *    as opaque strings here; decrypt at the point of use only.
 */

export type Category =
  | "Opportunity"
  | "Revenue"
  | "Partnership"
  | "Investor"
  | "Hiring"
  | "Urgent"
  | "Competition"
  | "Scholarship"
  | "College"
  | "Client"
  | "Marketing"
  | "Newsletter"
  | "Spam";

export type Sentiment = "positive" | "neutral" | "negative";

export interface InboxUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  plan: "free" | "premium";
  createdAt: number; // epoch ms
}

export interface ConnectedAccount {
  accountId: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  /** AES-256-GCM ciphertext, see lib/crypto.ts */
  accessToken: string;
  /** AES-256-GCM ciphertext */
  refreshToken: string;
  accessTokenExpiresAt: number | null;
  connectedAt: number;
  lastSync: number | null;
  status: "connected" | "needs_reauth" | "syncing" | "error";
  lastError?: string | null;
}

export interface InboxEmail {
  emailId: string;
  uid: string;
  accountId: string;
  accountEmail: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  snippet: string;
  timestamp: number;
  labels: string[];
  threadId: string;
}

export interface EmailAnalysis {
  emailId: string;
  uid: string;
  accountId: string;
  category: Category;
  priority: number; // 1-10
  summary: string;
  actionItems: string[];
  deadline: string | null; // ISO date, e.g. "2026-07-10"
  opportunityScore: number; // 0-100
  sentiment: Sentiment;
  analyzedAt: number;
}

export interface Contact {
  contactId: string;
  uid: string;
  name: string;
  email: string;
  company: string | null;
  relationshipScore: number; // 0-100
  messageCount: number;
  lastContact: number;
  notes: string;
  suggestedAction: string;
  updatedAt: number;
}

export interface DailyBrief {
  briefId: string; // `${uid}_${date}`
  uid: string;
  date: string; // YYYY-MM-DD
  digest: string;
  opportunities: { title: string; score: number; emailId: string }[];
  urgentItems: { title: string; emailId: string; deadline: string | null }[];
  emailsScanned: number;
  createdAt: number;
}

export interface DashboardStats {
  connectedInboxes: number;
  totalEmails: number;
  opportunityCount: number;
  urgentCount: number;
  deadlinesToday: number;
}
