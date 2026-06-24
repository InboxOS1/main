import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDeadlineLabel } from "@/lib/utils";
import { Sunrise } from "lucide-react";
import type { DailyBrief } from "@/lib/types";

export function DailyBriefCard({ brief }: { brief: DailyBrief }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-signal" />
          Daily Brief
          <span className="ml-auto font-mono text-xs font-normal text-paper/40">{brief.date}</span>
        </CardTitle>
        <CardDescription>{brief.emailsScanned} emails scanned</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-paper/80">{brief.digest}</p>

        {brief.opportunities.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-signal">Potential opportunities</p>
            <ul className="space-y-1.5">
              {brief.opportunities.map((o) => (
                <li key={o.emailId} className="flex items-center justify-between text-sm">
                  <span className="truncate text-paper/80">{o.title}</span>
                  <span className="font-mono text-xs text-signal">{o.score}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {brief.urgentItems.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-alert">Today&apos;s priorities</p>
            <ul className="space-y-1.5">
              {brief.urgentItems.map((u, i) => (
                <li key={u.emailId} className="flex items-center justify-between text-sm">
                  <span className="truncate text-paper/80">
                    {i + 1}. {u.title}
                  </span>
                  <Badge variant="alert">{formatDeadlineLabel(u.deadline)}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
