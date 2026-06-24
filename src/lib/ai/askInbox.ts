import "server-only";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { generateJSON } from "@/lib/ai/gemini";
import { ASK_INBOX_SYSTEM_PROMPT, ASK_INBOX_RESPONSE_SCHEMA } from "@/lib/ai/prompts";
import type { EmailAnalysis, InboxEmail } from "@/lib/types";

const CONTEXT_WINDOW = 250;

type AskResult = { answer: string; sourceEmailIds: string[] };

export interface AskInboxResponse {
  answer: string;
  sources: { emailId: string; subject: string; sender: string; accountEmail: string }[];
}

export async function askInbox(uid: string, question: string): Promise<AskInboxResponse> {
  const analysisSnap = await db
    .collection(COLLECTIONS.analysis)
    .where("uid", "==", uid)
    .orderBy("analyzedAt", "desc")
    .limit(CONTEXT_WINDOW)
    .get();

  const analyses = analysisSnap.docs.map((d) => d.data() as EmailAnalysis);
  if (analyses.length === 0) {
    return {
      answer:
        "I don't have any classified emails to search yet. Connect an inbox and let it sync, then ask again.",
      sources: [],
    };
  }

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
        accountEmail: email.accountEmail,
        date: new Date(email.timestamp).toISOString().slice(0, 10),
        category: a.category,
        summary: a.summary,
      };
    })
    .filter(Boolean);

  const prompt = `Question: ${question}

Available emails (JSON):
${JSON.stringify(condensed)}`;

  const result = await generateJSON<AskResult>({
    systemInstruction: ASK_INBOX_SYSTEM_PROMPT,
    prompt,
    responseSchema: ASK_INBOX_RESPONSE_SCHEMA,
    temperature: 0.2,
  });

  const sources = result.sourceEmailIds
    .map((id) => {
      const email = emailById.get(id);
      if (!email) return null;
      return { emailId: id, subject: email.subject, sender: email.sender, accountEmail: email.accountEmail };
    })
    .filter((s): s is AskInboxResponse["sources"][number] => Boolean(s));

  return { answer: result.answer, sources };
}
