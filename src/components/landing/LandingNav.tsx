"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Radar } from "lucide-react";

export function LandingNav() {
  const { signInWithGoogle, signingIn } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Radar className="h-5 w-5 text-signal" strokeWidth={2.25} />
          InboxOS
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-paper/60 md:flex">
          <a href="#how-it-works" className="hover:text-paper transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-paper transition-colors">
            Product
          </a>
          <a href="#pricing" className="hover:text-paper transition-colors">
            Pricing
          </a>
        </nav>
        <Button size="sm" onClick={signInWithGoogle} disabled={signingIn}>
          {signingIn ? "Connecting…" : "Connect Gmail"}
        </Button>
      </div>
    </header>
  );
}
