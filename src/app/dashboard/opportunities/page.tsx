import { getCurrentUser } from "@/lib/session";
import { getOpportunities } from "@/lib/dashboard";
import { RadarScope, type RadarBlip } from "@/components/dashboard/RadarScope";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatDeadlineLabel } from "@/lib/utils";
import { Target } from "lucide-react";

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const opportunities = await getOpportunities(user.uid, 60);
  const blips: RadarBlip[] = opportunities.slice(0, 20).map((o) => ({
    id: o.emailId,
    label: o.title,
    score: o.score,
    tone: o.score >= 80 ? "signal" : o.score >= 50 ? "scope" : "alert",
  }));

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <Target className="h-5 w-5 text-signal" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Opportunities</h1>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={Target}
              title="Nothing scored yet"
              body="Once your inboxes sync, scholarships, funding, partnerships, and other leads will rank here by opportunity score."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="mx-auto">
            <RadarScope blips={blips} size={280} />
          </div>
          <div className="space-y-2">
            {opportunities.map((o) => (
              <Card key={o.emailId}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="truncate text-xs text-paper/40">
                      {o.sender} · {o.accountEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="outline">{o.category}</Badge>
                    <Badge variant="alert">{formatDeadlineLabel(o.deadline)}</Badge>
                    <span className="w-8 text-right font-mono text-sm font-semibold text-signal">{o.score}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
