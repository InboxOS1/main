import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  getConnectedAccounts,
  getOpportunities,
  getUpcomingDeadlines,
  getDashboardStats,
} from "@/lib/dashboard";
import { getStaleContacts } from "@/lib/contacts/intelligence";
import { getTodaysBrief } from "@/lib/ai/dailyBrief";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpportunityRadarWidget } from "@/components/dashboard/OpportunityRadarWidget";
import { DeadlineCenter } from "@/components/dashboard/DeadlineCenter";
import { RelationshipAlerts } from "@/components/dashboard/RelationshipAlerts";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";
import { ActionButton } from "@/components/dashboard/ActionButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Sunrise } from "lucide-react";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [accounts, stats, opportunities, deadlines, staleContacts, brief] = await Promise.all([
    getConnectedAccounts(user.uid),
    getDashboardStats(user.uid),
    getOpportunities(user.uid, 14),
    getUpcomingDeadlines(user.uid, 10),
    getStaleContacts(user.uid),
    getTodaysBrief(user.uid),
  ]);

  return (
    <div>
      <DashboardHeader name={user.name} stats={stats} />

      {accounts.length === 0 && (
        <Card className="mb-8 border-signal/30 bg-signal/5">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Inbox className="h-6 w-6 text-signal" />
            <p className="font-display text-lg font-semibold">Connect your first inbox</p>
            <p className="max-w-sm text-sm text-paper/60">
              InboxOS has nothing to scan yet. Connect a Gmail account to start surfacing opportunities and
              deadlines.
            </p>
            <Button asChild>
              <Link href="/dashboard/accounts">Connect Gmail</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OpportunityRadarWidget opportunities={opportunities} />
        </div>
        <DeadlineCenter deadlines={deadlines} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RelationshipAlerts contacts={staleContacts} />

        {brief ? (
          <DailyBriefCard brief={brief} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Sunrise className="h-5 w-5 text-signal" />
              <p className="text-sm font-medium">No brief generated yet today</p>
              <p className="max-w-xs text-xs text-paper/40">
                Generate a digest of everything that happened across your inboxes in the last 24 hours.
              </p>
              <ActionButton
                endpoint="/api/daily-brief"
                label="Generate today's brief"
                loadingLabel="Writing brief…"
                successMessage="Daily brief generated."
                size="sm"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
