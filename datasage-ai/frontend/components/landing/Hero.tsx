"use client";

import { Sparkles } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import type { UploadResponse } from "@/lib/api";

export function Hero({ onUploaded }: { onUploaded: (data: UploadResponse) => void }) {
  return (
    <section className="relative overflow-hidden pb-10 pt-24 sm:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-aurora" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-ink-soft">
          <Sparkles size={13} className="text-sage" />
          Built for the 24-hour build
        </div>

        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-7xl">
          Chat with your data.
          <br />
          <span className="text-gradient">Get insights in seconds.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-ink-muted">
          Drop in a spreadsheet. DataSage AI profiles it, charts it, and lets you ask
          it questions in plain English — no formulas, no pivot tables.
        </p>

        <div className="mx-auto mt-10 max-w-xl">
          <UploadZone onUploaded={onUploaded} />
        </div>

        {/* Signature element: an insight assembling itself out of raw data points */}
        <div className="relative mx-auto mt-20 h-64 max-w-3xl">
          <InsightPulse />
        </div>
      </div>
    </section>
  );
}

function InsightPulse() {
  const points = [
    [20, 190], [90, 165], [160, 178], [230, 130], [300, 145],
    [370, 95], [440, 110], [510, 60], [580, 80], [650, 40],
  ];
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${path} L650,220 L20,220 Z`;

  return (
    <svg viewBox="0 0 680 230" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pulseLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C7CF0" />
          <stop offset="100%" stopColor="#34E2C4" />
        </linearGradient>
        <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34E2C4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#34E2C4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#pulseArea)" className="animate-rise" style={{ animationDelay: "0.9s" }} />

      <path
        d={path}
        stroke="url(#pulseLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="900"
        className="animate-draw-line"
      />

      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === points.length - 1 ? 5 : 3}
          fill={i === points.length - 1 ? "#7CFCE5" : "#34E2C4"}
          className="animate-rise"
          style={{ animationDelay: `${0.05 * i + 0.3}s` }}
        />
      ))}

      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="10" fill="#34E2C4" opacity="0.25" className="animate-pulse-dot" />

      {/* Floating annotation callout */}
      <g className="animate-rise" style={{ animationDelay: "1.6s" }}>
        <rect x="520" y="14" width="150" height="36" rx="10" fill="#0B0F1A" fillOpacity="0.85" stroke="#34E2C4" strokeOpacity="0.35" />
        <circle cx="538" cy="32" r="4" fill="#34E2C4" />
        <text x="550" y="36" fill="#E7ECF5" fontSize="13" fontFamily="var(--font-mono)">
          Revenue +18%
        </text>
      </g>
    </svg>
  );
}
