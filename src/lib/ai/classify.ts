import "server-only";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { generateJSON } from "@/lib/ai/gemini";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  CLASSIFICATION_RESPONSE_SCHEMA,
  buildClassificationPrompt,
} from "@/lib/ai/prompts";
import { MAX_EMAILS_PER_ANALYZE_BATCH } from "@/lib/constants";
import type { EmailAnalysis, InboxEmail, Category, Sentiment } from "@/lib/types";

type ClassificationResult = {
  category: Category;
  priority: number;
  summary: string;
  actionItems: string[];
  deadline: string | null;
  opportunityScore: number;
  sentiment: Sentiment;
};

export async function classifyEmail(email: InboxEmail): Promise<EmailAnalysis> {
  const result = await generateJSON<ClassificationResult>({
    systemInstruction: CLASSIFICATION_SYSTEM_PROMPT,
    prompt: buildClassificationPrompt({
      subject: email.subject,
      sender: email.sender,
      senderEmail: email.senderEmail,
      body: email.body || email.snippet,
    }),
    responseSchema: CLASSIFICATION_RESPONSE_SCHEMA,
  });

  return {
    emailId: email.emailId,
    uid: email.uid,
    accountId: email.accountId,
    ...result,
    analyzedAt: Date.now(),
  };
}

/**
 * Finds emails for `uid` that don't have an analysis doc yet and
 * classifies up to MAX_EMAILS_PER_ANALYZE_BATCH of them. Firestore has
 * no cross-collection NOT-IN join, so we pull a window of recent
 * emails and diff against existing analysis docs by id.
 */
export async function analyzeUnanalyzedEmails(uid: string): Promise<{ analyzed: number; remaining: boolean }> {
  const windowSize = MAX_EMAILS_PER_ANALYZE_BATCH * 3;
  const emailsSnap = await db
    .collection(COLLECTIONS.emails)
    .where("uid", "==", uid)
    .orderBy("timestamp", "desc")
    .limit(windowSize)
    .get();

  if (emailsSnap.empty) return { analyzed: 0, remaining: false };

  const emailDocs = emailsSnap.docs.map((d) => d.data() as InboxEmail);
  const analysisRefs = emailDocs.map((e) => db.collection(COLLECTIONS.analysis).doc(e.emailId));
  const analysisSnaps = await db.getAll(...analysisRefs);

  const unanalyzed = emailDocs.filter((_, i) => !analysisSnaps[i]?.exists);
  const batch = unanalyzed.slice(0, MAX_EMAILS_PER_ANALYZE_BATCH);

  let analyzed = 0;
  for (const email of batch) {
    try {
      const analysis = await classifyEmail(email);
      await db.collection(COLLECTIONS.analysis).doc(email.emailId).set(analysis);
      analyzed++;
    } catch (err) {
      // Don't let one bad email (e.g. malformed body) abort the whole batch.
      console.error(`Failed to classify email ${email.emailId}:`, err);
    }
  }

  return { analyzed, remaining: unanalyzed.length > batch.length };
}
