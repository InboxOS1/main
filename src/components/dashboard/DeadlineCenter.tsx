import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatDeadlineLabel } from "@/lib/utils";
import { CalendarClock } from "lucide-react";
import type { DeadlineRow } from "@/lib/dashboard";

export function DeadlineCenter({ deadlines }: { deadlines: DeadlineRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-alert" />
          Deadline Center
        </CardTitle>
        <CardDescription>Every date buried in an email, in one manifest</CardDescription>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <EmptyState title="Nothing due soon" body="Deadlines extracted from your emails will line up here." />
        ) : (
          <ul className="space-y-3">
            {deadlines.slice(0, 6).map((d) => (
              <li key={d.emailId} className="flex items-center gap-3">
                <div
                  className={`w-16 shrink-0 font-mono text-xs uppercase tracking-wide ${
                    d.daysUntil <= 1 ? "text-alert" : "text-paper/40"
                  }`}
                >
                  {formatDeadlineLabel(d.deadline)}
                </div>
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-line" />
                <p className="truncate text-sm text-paper/80">{d.title}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
