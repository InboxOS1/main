import "server-only";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { generateJSON } from "@/lib/ai/gemini";
import { DAILY_BRIEF_SYSTEM_PROMPT, DAILY_BRIEF_RESPONSE_SCHEMA } from "@/lib/ai/prompts";
import type { DailyBrief, EmailAnalysis, InboxEmail, InboxUser } from "@/lib/types";

const LOOKBACK_MS = 24 * 60 * 60 * 1000;

type BriefResult = {
  digest: string;
  opportunities: { title: string; score: number; emailId: string }[];
  urgentItems: { title: string; emailId: string; deadline: string | null }[];
};

export async function generateDailyBrief(uid: string, user: InboxUser | null): Promise<DailyBrief> {
  const since = Date.now() - LOOKBACK_MS;

  const analysisSnap = await db
    .collection(COLLECTIONS.analysis)
    .where("uid", "==", uid)
    .where("analyzedAt", ">=", since)
    .orderBy("analyzedAt", "desc")
    .limit(150)
    .get();

  const analyses = analysisSnap.docs.map((d) => d.data() as EmailAnalysis);

  if (analyses.length === 0) {
    const date = new Date().toISOString().slice(0, 10);
    const empty: DailyBrief = {
      briefId: `${uid}_${date}`,
      uid,
      date,
      digest: "No new emails were analyzed in the last 24 hours. Sync your inboxes to refresh this brief.",
      opportunities: [],
      urgentItems: [],
      emailsScanned: 0,
      createdAt: Date.now(),
    };
    await db.collection(COLLECTIONS.dailyBriefs).doc(empty.briefId).set(empty);
    return empty;
  }

  // Pull matching emails so the prompt has subject lines, not just emailIds.
  const emailRefs = analyses.map((a) => db.collection(COLLECTIONS.emails).doc(a.emailId));
  const emailSnaps = await db.getAll(...emailRefs);
  const emailById = new Map(emailSnaps.map((s) => [s.id, s.data() as InboxEmail | undefined]));

  const condensed = analyses
    .map((a) => {
      const email = emailById.get(a.emailId);
      if (!email) return null;
      return {
        emailId: a.emailId,
        subject: email.subject,
        sender: email.sender,
        category: a.category,
        priority: a.priority,
        summary: a.summary,
        deadline: a.deadline,
        opportunityScore: a.opportunityScore,
      };
    })
    .filter(Boolean);

  const prompt = `Founder name: ${user?.name ?? "there"}
Inboxes scanned: across all connected accounts
Emails analyzed in the last 24 hours: ${condensed.length}

Classified emails (JSON):
${JSON.stringify(condensed)}`;

  const result = await generateJSON<BriefResult>({
    systemInstruction: DAILY_BRIEF_SYSTEM_PROMPT,
    prompt,
    responseSchema: DAILY_BRIEF_RESPONSE_SCHEMA,
    temperature: 0.4,
  });

  const date = new Date().toISOString().slice(0, 10);
  const brief: DailyBrief = {
    briefId: `${uid}_${date}`,
    uid,
    date,
    digest: result.digest,
    opportunities: result.opportunities,
    urgentItems: result.urgentItems,
    emailsScanned: condensed.length,
    createdAt: Date.now(),
  };

  await db.collection(COLLECTIONS.dailyBriefs).doc(brief.briefId).set(brief);
  return brief;
}

export async function getTodaysBrief(uid: string): Promise<DailyBrief | null> {
  const date = new Date().toISOString().slice(0, 10);
  const snap = await db.collection(COLLECTIONS.dailyBriefs).doc(`${uid}_${date}`).get();
  return snap.exists ? (snap.data() as DailyBrief) : null;
}

export async function getRecentBriefs(uid: string, limit = 14): Promise<DailyBrief[]> {
  const snap = await db
    .collection(COLLECTIONS.dailyBriefs)
    .where("uid", "==", uid)
    .orderBy("date", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as DailyBrief);
}
