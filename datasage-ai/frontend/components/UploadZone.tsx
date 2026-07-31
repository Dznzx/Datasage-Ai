"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, UploadResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUploaded: (data: UploadResponse) => void;
  compact?: boolean;
}

export function UploadZone({ onUploaded, compact }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runUpload = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const data = await api.upload(file);
        onUploaded(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed. Try a different file.");
      } finally {
        setLoading(false);
      }
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) runUpload(file);
    },
    [runUpload]
  );

  const handleSample = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(api.sampleUrl());
      const blob = await res.blob();
      const file = new File([blob], "sample_sales.csv", { type: "text/csv" });
      await runUpload(file);
    } catch {
      setError("Couldn't load the sample dataset. Is the backend running?");
      setLoading(false);
    }
  }, [runUpload]);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "glass-card group relative cursor-pointer overflow-hidden border-2 border-dashed px-8 text-center transition-all duration-300",
          compact ? "py-8" : "py-14",
          dragOver ? "border-sage bg-sage/[0.06] scale-[1.01]" : "border-white/10 hover:border-sage/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) runUpload(file);
          }}
        />
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          {loading ? (
            <Loader2 className="animate-spin text-sage" size={compact ? 28 : 36} />
          ) : (
            <div className="rounded-2xl bg-sage/10 p-4 text-sage transition-transform group-hover:scale-110">
              <UploadCloud size={compact ? 24 : 32} />
            </div>
          )}
          <div>
            <p className={cn("font-display font-semibold text-ink", compact ? "text-base" : "text-lg")}>
              {loading ? "Analyzing your dataset…" : "Drop a CSV or Excel file here"}
            </p>
            <p className="mt-1 text-sm text-ink-muted">or click to browse — up to 25MB, .csv / .xlsx</p>
          </div>
          {!loading && (
            <Button
              size={compact ? "sm" : "md"}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <FileSpreadsheet size={16} />
              Upload Dataset
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
        <span>No file handy?</span>
        <button onClick={handleSample} disabled={loading} className="font-medium text-sage underline-offset-4 hover:underline disabled:opacity-50">
          Try the sample dataset →
        </button>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-signal-rose">{error}</p>
      )}
    </div>
  );
}
