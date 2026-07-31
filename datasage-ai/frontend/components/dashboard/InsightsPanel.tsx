import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <Badge tone="sage">
          <Sparkles size={11} />
          Auto-generated
        </Badge>
      </CardHeader>
      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3 text-sm text-ink-soft animate-rise" style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sage/15 text-[10px] font-semibold text-sage">
              {i + 1}
            </span>
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  );
}
