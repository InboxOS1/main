"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { RadarScope } from "@/components/dashboard/RadarScope";
import { ArrowRight, Radar } from "lucide-react";
import { motion } from "framer-motion";

const DEMO_BLIPS = [
  { id: "yc", label: "YC Startup School", score: 98, tone: "signal" as const },
  { id: "tedx", label: "TEDx Youth", score: 94, tone: "signal" as const },
  { id: "ntu", label: "NTU Scholarship", score: 92, tone: "signal" as const },
  { id: "invA", label: "Investor reply due", score: 80, tone: "alert" as const },
  { id: "partner", label: "Partnership proposal", score: 70, tone: "scope" as const },
  { id: "hack", label: "Hackathon registration", score: 60, tone: "scope" as const },
  { id: "news1", label: "Newsletter", score: 14, tone: "scope" as const },
  { id: "news2", label: "Marketing blast", score: 8, tone: "scope" as const },
];

export function Hero() {
  const { signInWithGoogle, signingIn } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-ink-line/60 scope-grid">
      <div className="container grid items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-scope/30 bg-scope/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-scope">
            <Radar className="h-3.5 w-3.5" />
            Multi-inbox command center
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            Stop checking email.
            <br />
            <span className="text-signal">Start finding opportunities.</span>
          </h1>
          <p className="mt-6 max-w-lg text-balance text-lg text-paper/65">
            InboxOS scans every inbox you run, finds the deadlines buried inside them, and surfaces the
            opportunities worth your attention — before they expire in someone else&apos;s unread folder.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={signInWithGoogle} disabled={signingIn} className="group">
              {signingIn ? "Connecting…" : "Connect Gmail"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <a href="#how-it-works" className="text-sm text-paper/60 underline-offset-4 hover:underline">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-paper/35">
            Google Sign-In only. Read-only Gmail access. Connect as many inboxes as you run.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mx-auto"
        >
          <RadarScope blips={DEMO_BLIPS} size={380} decorative />
        </motion.div>
      </div>
    </section>
  );
}
