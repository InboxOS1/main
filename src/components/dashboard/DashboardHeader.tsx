import type { DashboardStats } from "@/lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatChip({ label, value, tone = "paper" }: { label: string; value: number | string; tone?: "paper" | "signal" | "alert" }) {
  const toneClass = tone === "signal" ? "text-signal" : tone === "alert" ? "text-alert" : "text-paper";
  return (
    <div className="flex flex-col gap-0.5 border-l border-ink-line px-5 first:border-l-0 first:pl-0">
      <span className={`font-mono text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</span>
      <span className="text-xs uppercase tracking-wide text-paper/40">{label}</span>
    </div>
  );
}

export function DashboardHeader({ name, stats }: { name: string; stats: DashboardStats }) {
  return (
    <div className="mb-8 flex flex-col gap-6 rounded-lg border border-ink-line bg-ink-raised/60 p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {greeting()}, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-paper/50">
          Across {stats.connectedInboxes} {stats.connectedInboxes === 1 ? "inbox" : "inboxes"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <StatChip label="Emails" value={stats.totalEmails} />
        <StatChip label="Opportunities" value={stats.opportunityCount} tone="signal" />
        <StatChip label="Urgent items" value={stats.urgentCount} tone="alert" />
        <StatChip label="Deadlines today" value={stats.deadlinesToday} tone="alert" />
      </div>
    </div>
  );
}
