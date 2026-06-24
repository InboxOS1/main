import { NextRequest, NextResponse } from "next/server";
import { db, COLLECTIONS } from "@/lib/firebase/admin";
import { syncAccountEmails } from "@/lib/google/gmail";
import { analyzeUnanalyzedEmails } from "@/lib/ai/classify";
import { generateDailyBrief } from "@/lib/ai/dailyBrief";
import type { ConnectedAccount, InboxUser } from "@/lib/types";

// Generous budget since this fans out across every user + every inbox.
// Vercel Hobby caps function duration at 60s — on Hobby, either
// upgrade or split this into a queue (see README "Scaling the cron").
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const usersSnap = await db.collection(COLLECTIONS.users).get();
  const results: { uid: string; ok: boolean; error?: string }[] = [];

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data() as InboxUser;
    try {
      const accountsSnap = await db
        .collection(COLLECTIONS.connectedAccounts)
        .where("uid", "==", user.uid)
        .get();
      const accounts = accountsSnap.docs.map((d) => d.data() as ConnectedAccount);

      for (const account of accounts) {
        try {
          await syncAccountEmails(account);
        } catch (err) {
          console.error(`Cron sync failed for ${account.email}:`, err);
        }
      }

      await analyzeUnanalyzedEmails(user.uid);
      await generateDailyBrief(user.uid, user);
      results.push({ uid: user.uid, ok: true });
    } catch (err) {
      results.push({ uid: user.uid, ok: false, error: err instanceof Error ? err.message : "failed" });
    }
  }

  return NextResponse.json({ usersProcessed: results.length, results });
}
