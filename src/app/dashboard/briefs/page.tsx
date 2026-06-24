import { getCurrentUser } from "@/lib/session";
import { getRecentBriefs } from "@/lib/ai/dailyBrief";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Sunrise } from "lucide-react";

export default async function BriefsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const briefs = await getRecentBriefs(user.uid);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sunrise className="h-5 w-5 text-signal" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Daily Briefs</h1>
        </div>
        <ActionButton
          endpoint="/api/daily-brief"
          label="Generate today's brief"
          loadingLabel="Writing brief…"
          successMessage="Daily brief generated."
          size="sm"
        />
      </div>

      {briefs.length === 0 ? (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={Sunrise}
              title="No briefs yet"
              body="Generate your first morning brief, or wait for tomorrow's automatic digest."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {briefs.map((b) => (
            <DailyBriefCard key={b.briefId} brief={b} />
          ))}
        </div>
      )}
    </div>
  );
}
