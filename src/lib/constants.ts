import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  "Opportunity",
  "Revenue",
  "Partnership",
  "Investor",
  "Hiring",
  "Urgent",
  "Competition",
  "Scholarship",
  "College",
  "Client",
  "Marketing",
  "Newsletter",
  "Spam",
];

/** Categories the Opportunity Radar treats as "signal" worth surfacing. */
export const OPPORTUNITY_CATEGORIES: Category[] = [
  "Opportunity",
  "Scholarship",
  "Investor",
  "Partnership",
  "Competition",
];

export const CATEGORY_ACCENT: Record<Category, "signal" | "scope" | "alert" | "muted"> = {
  Opportunity: "signal",
  Scholarship: "signal",
  Investor: "signal",
  Partnership: "scope",
  Competition: "signal",
  Revenue: "scope",
  Hiring: "scope",
  Client: "scope",
  College: "scope",
  Urgent: "alert",
  Marketing: "muted",
  Newsletter: "muted",
  Spam: "muted",
};

/**
 * Scopes requested when a user connects a Gmail inbox. This is a
 * separate, incremental OAuth grant from the Firebase Auth sign-in —
 * see lib/google/oauth.ts.
 */
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const EMAILS_PER_ACCOUNT_SYNC = 200;

/** Cap on emails classified per single /api/analyze invocation, to stay
 *  inside a serverless function's time budget. Remaining emails are
 *  picked up by the next sync/analyze call or the daily cron. */
export const MAX_EMAILS_PER_ANALYZE_BATCH = 40;

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
