import { Search, TrendingUp, Gauge, ListChecks, FileText, Radar } from "lucide-react";

const suggestions = [
  { label: "Analyze Dataset", icon: Radar, question: "Give me a full analysis of this dataset." },
  { label: "Generate KPIs", icon: Gauge, question: "Generate the key KPIs for this dataset." },
  { label: "Find Outliers", icon: Search, question: "Are there any outliers in this data?" },
  { label: "Find Trends", icon: TrendingUp, question: "What trends do you see over time?" },
  { label: "Summarize", icon: FileText, question: "Summarize this dataset." },
  { label: "Forecast", icon: ListChecks, question: "Forecast next month's numbers." },
];

export function SuggestedChips({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button key={s.label} onClick={() => onPick(s.question)} className="chip">
          <s.icon size={13} />
          {s.label}
        </button>
      ))}
    </div>
  );
}
