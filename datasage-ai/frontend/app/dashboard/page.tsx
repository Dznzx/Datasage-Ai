"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, ChevronDown, History, LayoutDashboard, FileText as FileTextIcon, UploadCloud } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ChartsGrid } from "@/components/dashboard/ChartsGrid";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { DataPreviewTable } from "@/components/dashboard/DataPreviewTable";
import { ReportGenerator } from "@/components/dashboard/ReportGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, type RecentDataset, type UploadResponse } from "@/lib/api";

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [data, setData] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "report">("overview");
  const [recentOpen, setRecentOpen] = useState(false);
  const [recent, setRecent] = useState<RecentDataset[]>([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const cached = sessionStorage.getItem(`ds:${id}`);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getDataset(id)
      .then((res) => {
        setData(res);
        sessionStorage.setItem(`ds:${id}`, JSON.stringify(res));
      })
      .catch(() => setError("This dataset session has expired. Please upload again."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api.recent().then((r) => setRecent(r.datasets)).catch(() => {});
  }, [data]);

  const handleUploaded = useCallback(
    (res: UploadResponse) => {
      sessionStorage.setItem(`ds:${res.dataset_id}`, JSON.stringify(res));
      setData(res);
      setTab("overview");
      router.push(`/dashboard?id=${res.dataset_id}`);
    },
    [router]
  );

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-base-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 font-display font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/10 text-sage">
              <BrainCircuit size={18} />
            </span>
            DataSage AI
          </button>

          {data && (
            <div className="hidden items-center gap-1 rounded-full border border-border p-1 sm:flex">
              <button
                onClick={() => setTab("overview")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  tab === "overview" ? "bg-sage/15 text-sage" : "text-ink-muted hover:text-ink"
                }`}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </button>
              <button
                onClick={() => setTab("report")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  tab === "report" ? "bg-sage/15 text-sage" : "text-ink-muted hover:text-ink"
                }`}
              >
                <FileTextIcon size={14} />
                Report
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setRecentOpen((v) => !v)}
                className="glass flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm text-ink-soft hover:text-sage"
              >
                <History size={14} />
                <span className="hidden sm:inline">Recent</span>
                <ChevronDown size={13} />
              </button>
              {recentOpen && (
                <div className="glass-card absolute right-0 top-11 z-40 w-64 p-2">
                  {recent.length === 0 && <p className="p-3 text-xs text-ink-muted">No uploads yet this session.</p>}
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRecentOpen(false);
                        router.push(`/dashboard?id=${r.id}`);
                      }}
                      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.05]"
                    >
                      <span className="truncate text-ink">{r.filename}</span>
                      <span className="text-xs text-ink-muted">
                        {r.rows.toLocaleString()} rows · {r.columns} cols
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <UploadCloud size={14} />
              <span className="hidden sm:inline">New upload</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        {loading && <DashboardSkeleton />}

        {!loading && !data && (
          <div className="mx-auto max-w-xl pt-16">
            <h2 className="mb-2 text-center font-display text-2xl font-semibold text-ink">
              {error || "Upload a dataset to get started"}
            </h2>
            <p className="mb-6 text-center text-sm text-ink-muted">
              Your dashboard, charts, and AI chat will appear here the moment a file lands.
            </p>
            <UploadZone onUploaded={handleUploaded} />
          </div>
        )}

        {!loading && data && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink">{data.filename}</h1>
                <p className="text-sm text-ink-muted">Analyzed just now · {data.profile.total_rows.toLocaleString()} rows</p>
              </div>
            </div>

            {tab === "overview" ? (
              <div className="space-y-6">
                <StatsCards profile={data.profile} />
                <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                  <div className="space-y-6">
                    <ChartsGrid charts={data.charts} />
                    <DataPreviewTable datasetId={data.dataset_id} columnStats={data.profile.column_stats} />
                  </div>
                  <div className="space-y-6">
                    <InsightsPanel insights={data.insights} />
                    <div className="h-[560px] lg:sticky lg:top-24">
                      <ChatPanel datasetId={data.dataset_id} filename={data.filename} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ReportGenerator datasetId={data.dataset_id} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DashboardInner />
    </Suspense>
  );
}
