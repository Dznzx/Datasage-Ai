"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, ArrowRight, Download, FileText, Lightbulb, Loader2, Sparkles, Target } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, type ReportData } from "@/lib/api";

export function ReportGenerator({ datasetId }: { datasetId: string }) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.report(datasetId).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [datasetId]);

  if (loading || !report) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  const sections = [
    { title: "Key Insights", icon: Sparkles, items: report.key_insights, tone: "sage" as const },
    { title: "Business Recommendations", icon: Lightbulb, items: report.recommendations, tone: "violet" as const },
    { title: "Potential Risks", icon: AlertOctagon, items: report.risks, tone: "rose" as const },
    { title: "Next Steps", icon: ArrowRight, items: report.next_steps, tone: "amber" as const },
  ];

  const toneDot: Record<string, string> = {
    sage: "bg-sage",
    violet: "bg-signal-violet",
    rose: "bg-signal-rose",
    amber: "bg-signal-amber",
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/10 text-sage">
              <FileText size={17} />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">{report.title}</p>
              <p className="text-xs text-ink-muted">Auto-generated executive report</p>
            </div>
          </div>
          <a href={api.reportPdfUrl(datasetId)} download>
            <Button size="sm">
              <Download size={14} />
              Download PDF
            </Button>
          </a>
        </CardHeader>

        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Target size={13} />
          Executive Summary
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{report.executive_summary}</p>

        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {Object.entries(report.stats).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.03] p-3 text-center">
              <p className="font-mono text-lg font-semibold text-ink">{v}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-muted">{k.replace(/_/g, " ")}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 normal-case tracking-normal text-ink text-sm">
                <s.icon size={15} className="text-ink-muted" />
                {s.title}
              </CardTitle>
            </CardHeader>
            <ul className="space-y-2.5">
              {s.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${toneDot[s.tone]}`} />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
