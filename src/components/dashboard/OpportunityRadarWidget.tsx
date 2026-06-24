import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarScope, type RadarBlip } from "@/components/dashboard/RadarScope";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatDeadlineLabel } from "@/lib/utils";
import { Radar } from "lucide-react";
import type { OpportunityRow } from "@/lib/dashboard";

export function OpportunityRadarWidget({ opportunities }: { opportunities: OpportunityRow[] }) {
  const blips: RadarBlip[] = opportunities.slice(0, 14).map((o) => ({
    id: o.emailId,
    label: o.title,
    score: o.score,
    tone: o.score >= 80 ? "signal" : o.score >= 50 ? "scope" : "alert",
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-signal" />
            Opportunity Radar
          </CardTitle>
          <CardDescription>Ranked by what&apos;s worth chasing right now</CardDescription>
        </div>
        <Link href="/dashboard/opportunities" className="text-xs text-scope hover:underline">
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities yet"
            body="Connect an inbox and run a sync — Gemini scans every email for scholarships, funding, partnerships, and more."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="mx-auto">
              <RadarScope blips={blips} size={220} />
            </div>
            <ul className="space-y-2">
              {opportunities.slice(0, 5).map((o) => (
                <li
                  key={o.emailId}
                  className="flex items-center justify-between gap-3 rounded-md border border-ink-line/60 bg-ink px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="truncate text-xs text-paper/40">
                      {o.sender} · {o.accountEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {formatDeadlineLabel(o.deadline)}
                    </Badge>
                    <span className="font-mono text-sm font-semibold text-signal">{o.score}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
