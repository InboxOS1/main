import "server-only";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { OPPORTUNITY_CATEGORIES } from "@/lib/constants";
import { daysUntil } from "@/lib/utils";
import type { ConnectedAccount, DashboardStats, EmailAnalysis, InboxEmail } from "@/lib/types";

export async function getConnectedAccounts(uid: string): Promise<ConnectedAccount[]> {
  const snap = await db.collection(COLLECTIONS.connectedAccounts).where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as ConnectedAccount).sort((a, b) => a.connectedAt - b.connectedAt);
}

export interface OpportunityRow {
  emailId: string;
  title: string;
  category: EmailAnalysis["category"];
  score: number;
  deadline: string | null;
  sender: string;
  accountEmail: string;
}

/** Top opportunities across all of a user's inboxes, highest score first. */
export async function getOpportunities(uid: string, limit = 12): Promise<OpportunityRow[]> {
  const snap = await db
    .collection(COLLECTIONS.analysis)
    .where("uid", "==", uid)
    .where("category", "in", OPPORTUNITY_CATEGORIES)
    .orderBy("opportunityScore", "desc")
    .limit(limit)
    .get();

  const analyses = snap.docs.map((d) => d.data() as EmailAnalysis);
  if (analyses.length === 0) return [];

  const emailRefs = analyses.map((a) => db.collection(COLLECTIONS.emails).doc(a.emailId));
  const emailSnaps = await db.getAll(...emailRefs);
  const emailById = new Map(emailSnaps.map((s) => [s.id, s.data() as InboxEmail | undefined]));

  return analyses
    .map((a) => {
      const email = emailById.get(a.emailId);
      if (!email) return null;
      return {
        emailId: a.emailId,
        title: a.summary,
        category: a.category,
        score: a.opportunityScore,
        deadline: a.deadline,
        sender: email.sender,
        accountEmail: email.accountEmail,
      };
    })
    .filter((r): r is OpportunityRow => Boolean(r));
}

export interface DeadlineRow {
  emailId: string;
  title: string;
  deadline: string;
  daysUntil: number;
  category: EmailAnalysis["category"];
}

export async function getUpcomingDeadlines(uid: string, limit = 20): Promise<DeadlineRow[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const snap = await db
    .collection(COLLECTIONS.analysis)
    .where("uid", "==", uid)
    .where("deadline", ">=", todayIso)
    .orderBy("deadline", "asc")
    .limit(limit)
    .get();

  return snap.docs
    .map((d) => d.data() as EmailAnalysis)
    .filter((a) => a.deadline)
    .map((a) => ({
      emailId: a.emailId,
      title: a.summary,
      deadline: a.deadline as string,
      daysUntil: daysUntil(a.deadline) ?? 0,
      category: a.category,
    }));
}

export async function getDashboardStats(uid: string): Promise<DashboardStats> {
  const [accounts, opportunities, urgentSnap, deadlines] = await Promise.all([
    getConnectedAccounts(uid),
    getOpportunities(uid, 100),
    db.collection(COLLECTIONS.analysis).where("uid", "==", uid).where("priority", ">=", 8).get(),
    getUpcomingDeadlines(uid, 100),
  ]);

  const totalEmailsSnap = await db.collection(COLLECTIONS.emails).where("uid", "==", uid).count().get();

  return {
    connectedInboxes: accounts.length,
    totalEmails: totalEmailsSnap.data().count,
    opportunityCount: opportunities.length,
    urgentCount: urgentSnap.size,
    deadlinesToday: deadlines.filter((d) => d.daysUntil === 0).length,
  };
}
