const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Sign in once with Google, then connect every Gmail inbox you run — personal, startup, support, side projects. Unlimited accounts.",
  },
  {
    n: "02",
    title: "Scan",
    body: "InboxOS pulls your last 200 emails per inbox and runs each one through Gemini, classifying it into founder-relevant categories — not Gmail's.",
  },
  {
    n: "03",
    title: "Surface",
    body: "Opportunities, deadlines, and the people you've gone quiet on get pulled into one dashboard, ranked by what actually deserves your time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-ink-line/60 py-20">
      <div className="container">
        <p className="font-mono text-xs uppercase tracking-widest text-scope">How it works</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Three steps. Every inbox.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative rounded-lg border border-ink-line bg-ink-raised p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-3xl font-semibold text-ink-line">{step.n}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper/30">
                  step {i + 1} / {STEPS.length}
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-signal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
