"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search, Table2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { api, type ColumnStat } from "@/lib/api";

const PAGE_SIZE = 12;

export function DataPreviewTable({ datasetId, columnStats }: { datasetId: string; columnStats: ColumnStat[] }) {
  const [rows, setRows] = useState<string[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"data" | "columns">("data");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.preview(datasetId, page, PAGE_SIZE, search).then((res) => {
      if (!active) return;
      setRows(res.rows);
      setColumns(res.columns);
      setTotal(res.total);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [datasetId, page, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CardTitle>Dataset Preview</CardTitle>
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            <button
              onClick={() => setView("data")}
              className={`rounded-md px-2.5 py-1 transition-colors ${view === "data" ? "bg-sage/15 text-sage" : "text-ink-muted"}`}
            >
              Data
            </button>
            <button
              onClick={() => setView("columns")}
              className={`rounded-md px-2.5 py-1 transition-colors ${view === "columns" ? "bg-sage/15 text-sage" : "text-ink-muted"}`}
            >
              Columns
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === "data" && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search columns…"
                className="w-48 pl-9"
              />
            </div>
          )}
          <a href={api.downloadCleanUrl(datasetId)} download>
            <Button variant="outline" size="sm">
              <Download size={14} />
              Cleaned CSV
            </Button>
          </a>
        </div>
      </CardHeader>

      {view === "data" ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-white/[0.02]">
                  {columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/60">
                        {(columns.length > 0 ? columns : Array.from({ length: 5 })).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/60 transition-colors hover:bg-white/[0.02]">
                        {row.map((cell, j) => (
                          <td key={j} className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
            <span>
              {total.toLocaleString()} rows {search && `matching "${search}"`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border p-1.5 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-white/[0.02] text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Column</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Missing</th>
                <th className="px-4 py-2.5">Unique</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {columnStats.map((c) => (
                <tr key={c.name} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-medium text-ink flex items-center gap-2">
                    <Table2 size={13} className="text-ink-muted" />
                    {c.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={c.dtype === "numeric" ? "sage" : c.dtype === "datetime" ? "violet" : "amber"}>{c.dtype}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {c.missing} ({c.missing_pct}%)
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.unique}</td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {c.dtype === "numeric"
                      ? `mean ${c.mean} · min ${c.min} · max ${c.max}`
                      : c.dtype === "datetime"
                      ? `${c.min} → ${c.max}`
                      : c.top_values?.map((t) => `${t.value} (${t.count})`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
