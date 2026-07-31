"use client";

import { Rows3, Columns3, AlertTriangle, Hash, Tag, Copy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Profile } from "@/lib/api";
import { cn } from "@/lib/utils";

function HealthRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "#34E2C4" : score >= 50 ? "#F5A623" : "#F0678C";
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="absolute font-mono text-xl font-semibold text-ink">{score}</span>
    </div>
  );
}

export function StatsCards({ profile }: { profile: Profile }) {
  const stats = [
    { label: "Total Rows", value: profile.total_rows.toLocaleString(), icon: Rows3, tone: "sage" },
    { label: "Total Columns", value: profile.total_columns, icon: Columns3, tone: "violet" },
    { label: "Missing Values", value: `${profile.missing_values.toLocaleString()} (${profile.missing_pct}%)`, icon: AlertTriangle, tone: "amber" },
    { label: "Numeric Columns", value: profile.numeric_columns, icon: Hash, tone: "sage" },
    { label: "Categorical Columns", value: profile.categorical_columns, icon: Tag, tone: "violet" },
    { label: "Duplicate Rows", value: profile.duplicate_rows.toLocaleString(), icon: Copy, tone: "rose" },
  ] as const;

  const toneText: Record<string, string> = {
    sage: "text-sage bg-sage/10",
    violet: "text-signal-violet bg-signal-violet/10",
    amber: "text-signal-amber bg-signal-amber/10",
    rose: "text-signal-rose bg-signal-rose/10",
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card className="col-span-2 flex items-center gap-5 lg:col-span-1 lg:row-span-2 lg:flex-col lg:justify-center lg:text-center">
        <HealthRing score={profile.health_score} />
        <div>
          <p className="font-display text-sm font-semibold text-ink">Dataset Health</p>
          <p className="text-xs text-ink-muted">out of 100</p>
        </div>
      </Card>

      {stats.map((s, i) => (
        <Card key={s.label} className="animate-rise p-5" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className={cn("mb-3 inline-flex rounded-lg p-2", toneText[s.tone])}>
            <s.icon size={16} />
          </div>
          <p className="font-mono text-2xl font-semibold text-ink">{s.value}</p>
          <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
