import { BarChart3, MessageSquareText, FileOutput, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Instant dashboards",
    body: "Row counts, health score, distributions, correlations, and outliers — computed the moment your file lands.",
    tone: "sage" as const,
  },
  {
    icon: MessageSquareText,
    title: "Ask it anything",
    body: "\u201cWhich region underperformed?\u201d \u201cForecast next month.\u201d Get grounded answers, not guesses.",
    tone: "violet" as const,
  },
  {
    icon: FileOutput,
    title: "Boardroom-ready reports",
    body: "One click turns raw rows into an executive summary, risks, and recommendations — exportable as PDF.",
    tone: "amber" as const,
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Nothing leaves your session beyond a compact statistical summary sent to answer your question.",
    tone: "sage" as const,
  },
];

const toneClasses = {
  sage: "bg-sage/10 text-sage",
  violet: "bg-signal-violet/10 text-signal-violet",
  amber: "bg-signal-amber/10 text-signal-amber",
};

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">What you get</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Power BI's depth, ChatGPT's ease
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="glass-card animate-rise p-6 transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className={`mb-4 inline-flex rounded-xl p-3 ${toneClasses[f.tone]}`}>
              <f.icon size={20} />
            </div>
            <h3 className="font-display text-base font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
