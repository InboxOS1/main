import { getCurrentUser } from "@/lib/session";
import { getUpcomingDeadlines } from "@/lib/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatDeadlineLabel } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

export default async function DeadlinesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const deadlines = await getUpcomingDeadlines(user.uid, 60);

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-alert" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Deadline Center</h1>
      </div>

      {deadlines.length === 0 ? (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={CalendarClock}
              title="Nothing due"
              body="Dates mentioned inside your emails — scholarship submissions, hackathon registrations, grant deadlines — will line up here."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-ink-line p-0">
            {deadlines.map((d) => (
              <div key={d.emailId} className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-24 shrink-0 font-mono text-xs uppercase tracking-wide ${
                    d.daysUntil <= 1 ? "text-alert" : "text-paper/50"
                  }`}
                >
                  {formatDeadlineLabel(d.deadline)}
                </div>
                <p className="flex-1 truncate text-sm text-paper/80">{d.title}</p>
                <Badge variant="outline">{d.category}</Badge>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-paper/40">{d.deadline}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
