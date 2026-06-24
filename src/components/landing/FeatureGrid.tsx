import { Radar, CalendarClock, Users, MessageSquareText, Sunrise, Search } from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "Opportunity Radar",
    body: "Scholarships, accelerators, investor interest, and partnership leads — scored and ranked the moment they land.",
    tone: "text-signal",
  },
  {
    icon: CalendarClock,
    title: "Deadline Center",
    body: "Every date buried in an email body, pulled into one manifest so nothing expires unnoticed.",
    tone: "text-scope",
  },
  {
    icon: Users,
    title: "Relationship Alerts",
    body: "See exactly who you've gone quiet on — investors, partners, clients — and for how long.",
    tone: "text-alert",
  },
  {
    icon: Sunrise,
    title: "Daily Brief",
    body: "One morning digest across every inbox: what happened, what's urgent, what's worth chasing.",
    tone: "text-signal",
  },
  {
    icon: MessageSquareText,
    title: "Ask Inbox",
    body: "Ask in plain English — \"who mentioned internships this month?\" — and get a sourced answer.",
    tone: "text-scope",
  },
  {
    icon: Search,
    title: "Contact Intelligence",
    body: "Auto-built profiles for everyone you email, with relationship strength and a suggested next move.",
    tone: "text-alert",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-b border-ink-line/60 py-20">
      <div className="container">
        <p className="font-mono text-xs uppercase tracking-widest text-scope">The product</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Not an inbox. A command center.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-ink-line bg-ink-raised p-6 transition-colors hover:border-scope/40"
            >
              <f.icon className={`h-5 w-5 ${f.tone}`} strokeWidth={2} />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
