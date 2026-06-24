import "server-only";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { generateJSON } from "@/lib/ai/gemini";
import { CONTACT_INSIGHT_SYSTEM_PROMPT, CONTACT_INSIGHT_RESPONSE_SCHEMA } from "@/lib/ai/prompts";
import type { Contact, InboxEmail } from "@/lib/types";

const SCAN_LIMIT = 500;
const MAX_CONTACTS_TO_ENRICH = 25;

type ContactInsight = { company: string | null; notes: string; suggestedAction: string };

function relationshipScore(messageCount: number, lastContactMs: number): number {
  const daysSince = (Date.now() - lastContactMs) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - daysSince * 2); // decays ~2pts/day
  const frequencyScore = Math.min(100, messageCount * 8);
  return Math.round(recencyScore * 0.6 + frequencyScore * 0.4);
}

/**
 * Rebuilds the `contacts` collection for a user from raw email metadata
 * (cheap, deterministic aggregation), then asks Gemini for a one-line
 * relationship note + suggested action for the contacts most worth a
 * human glance (top by message count, capped to control API spend).
 */
export async function refreshContacts(uid: string): Promise<{ contactsUpdated: number }> {
  const emailsSnap = await db
    .collection(COLLECTIONS.emails)
    .where("uid", "==", uid)
    .orderBy("timestamp", "desc")
    .limit(SCAN_LIMIT)
    .get();

  const emails = emailsSnap.docs.map((d) => d.data() as InboxEmail);
  if (emails.length === 0) return { contactsUpdated: 0 };

  type Agg = { name: string; email: string; count: number; lastContact: number; emails: InboxEmail[] };
  const byEmail = new Map<string, Agg>();

  for (const email of emails) {
    const key = email.senderEmail;
    const existing = byEmail.get(key);
    if (existing) {
      existing.count++;
      existing.lastContact = Math.max(existing.lastContact, email.timestamp);
      if (existing.emails.length < 6) existing.emails.push(email);
    } else {
      byEmail.set(key, { name: email.sender, email: key, count: 1, lastContact: email.timestamp, emails: [email] });
    }
  }

  const ranked = Array.from(byEmail.values()).sort((a, b) => b.count - a.count);
  const toEnrich = ranked.slice(0, MAX_CONTACTS_TO_ENRICH);

  let updated = 0;
  for (const agg of toEnrich) {
    const contactId = `${uid}_${Buffer.from(agg.email).toString("base64url")}`;
    let insight: ContactInsight = {
      company: agg.email.split("@")[1]?.split(".")[0] ?? null,
      notes: `Exchanged ${agg.count} email${agg.count === 1 ? "" : "s"}; last contact ${new Date(agg.lastContact).toLocaleDateString()}.`,
      suggestedAction: "No action needed right now.",
    };

    try {
      insight = await generateJSON<ContactInsight>({
        systemInstruction: CONTACT_INSIGHT_SYSTEM_PROMPT,
        prompt: `Contact: ${agg.name} <${agg.email}>\nRecent emails (JSON):\n${JSON.stringify(
          agg.emails.map((e) => ({ subject: e.subject, snippet: e.snippet, date: new Date(e.timestamp).toISOString() }))
        )}`,
        responseSchema: CONTACT_INSIGHT_RESPONSE_SCHEMA,
      });
    } catch (err) {
      console.error(`Contact insight failed for ${agg.email}, using fallback:`, err);
    }

    const contact: Contact = {
      contactId,
      uid,
      name: agg.name,
      email: agg.email,
      company: insight.company,
      relationshipScore: relationshipScore(agg.count, agg.lastContact),
      messageCount: agg.count,
      lastContact: agg.lastContact,
      notes: insight.notes,
      suggestedAction: insight.suggestedAction,
      updatedAt: Date.now(),
    };

    await db.collection(COLLECTIONS.contacts).doc(contactId).set(contact);
    updated++;
  }

  return { contactsUpdated: updated };
}

export async function getStaleContacts(uid: string, minDaysSinceContact = 10): Promise<Contact[]> {
  const snap = await db.collection(COLLECTIONS.contacts).where("uid", "==", uid).get();
  const cutoff = Date.now() - minDaysSinceContact * 24 * 60 * 60 * 1000;
  return snap.docs
    .map((d) => d.data() as Contact)
    .filter((c) => c.lastContact < cutoff)
    .sort((a, b) => b.relationshipScore - a.relationshipScore);
}

export async function getAllContacts(uid: string): Promise<Contact[]> {
  const snap = await db.collection(COLLECTIONS.contacts).where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as Contact).sort((a, b) => b.relationshipScore - a.relationshipScore);
}
