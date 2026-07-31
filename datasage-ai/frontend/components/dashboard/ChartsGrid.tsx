"use client";

import { Fragment } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Charts } from "@/lib/api";

const PALETTE = ["#34E2C4", "#7C7CF0", "#F5A623", "#F0678C", "#5FA8FF", "#B98CF0"];

const tooltipStyle = {
  background: "#0F1424",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  fontSize: 12,
  color: "#E7ECF5",
};

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-ink-muted">{label} not available for this dataset</div>;
}

export function ChartsGrid({ charts }: { charts: Charts }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="h-80">
        <CardHeader>
          <CardTitle>Trend {charts.line ? `· ${charts.line.y_label}` : ""}</CardTitle>
        </CardHeader>
        <div className="h-56">
          {charts.line ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.line.data}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#8993A8" }} minTickGap={30} />
                <YAxis tick={{ fontSize: 11, fill: "#8993A8" }} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="y" stroke="#34E2C4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Line chart" />
          )}
        </div>
      </Card>

      <Card className="h-80">
        <CardHeader>
          <CardTitle>By Category {charts.bar ? `· ${charts.bar.category_label}` : ""}</CardTitle>
        </CardHeader>
        <div className="h-56">
          {charts.bar ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bar.data}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8993A8" }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#8993A8" }} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#7C7CF0" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Bar chart" />
          )}
        </div>
      </Card>

      <Card className="h-80">
        <CardHeader>
          <CardTitle>Distribution {charts.pie ? `· ${charts.pie.label}` : ""}</CardTitle>
        </CardHeader>
        <div className="h-56">
          {charts.pie ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.pie.data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {charts.pie.data.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8993A8" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Pie chart" />
          )}
        </div>
      </Card>

      <Card className="h-80">
        <CardHeader>
          <CardTitle>Histogram {charts.histogram ? `· ${charts.histogram.label}` : ""}</CardTitle>
        </CardHeader>
        <div className="h-56">
          {charts.histogram ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.histogram.data}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#8993A8" }} interval={0} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: "#8993A8" }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#F5A623" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Histogram" />
          )}
        </div>
      </Card>

      <Card className="h-80 lg:col-span-2">
        <CardHeader>
          <CardTitle>Correlation Heatmap</CardTitle>
        </CardHeader>
        <div className="h-56 overflow-auto">
          {charts.correlation ? <CorrelationHeatmap correlation={charts.correlation} /> : <EmptyState label="Correlation heatmap" />}
        </div>
      </Card>

      <Card className="h-80 lg:col-span-2">
        <CardHeader>
          <CardTitle>
            Scatter {charts.scatter ? `· ${charts.scatter.x_label} vs ${charts.scatter.y_label}` : ""}
          </CardTitle>
        </CardHeader>
        <div className="h-56">
          {charts.scatter ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" dataKey="x" name={charts.scatter.x_label} tick={{ fontSize: 11, fill: "#8993A8" }} />
                <YAxis type="number" dataKey="y" name={charts.scatter.y_label} tick={{ fontSize: 11, fill: "#8993A8" }} width={40} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
                <Scatter data={charts.scatter.data} fill="#5FA8FF" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Scatter plot" />
          )}
        </div>
      </Card>
    </div>
  );
}

function CorrelationHeatmap({ correlation }: { correlation: NonNullable<Charts["correlation"]> }) {
  const { columns, matrix } = correlation;
  const colorFor = (v: number) => {
    const t = (v + 1) / 2; // -1..1 -> 0..1
    const r = Math.round(240 - t * (240 - 52));
    const g = Math.round(120 + t * (226 - 120));
    const b = Math.round(140 + t * (196 - 140));
    return `rgba(${r},${g},${b},${0.25 + Math.abs(v) * 0.55})`;
  };
  return (
    <div className="inline-block min-w-full">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `120px repeat(${columns.length}, 64px)` }}
      >
        <div />
        {columns.map((c) => (
          <div key={c} className="truncate px-1 text-center text-[10px] text-ink-muted" title={c}>
            {c}
          </div>
        ))}
        {matrix.map((row, i) => (
          <Fragment key={`row-${i}`}>
            <div className="truncate pr-2 text-right text-[11px] text-ink-muted" title={columns[i]}>
              {columns[i]}
            </div>
            {row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                className="flex h-10 items-center justify-center rounded-md text-[11px] font-mono text-ink"
                style={{ background: colorFor(v ?? 0) }}
                title={`${columns[i]} × ${columns[j]}: ${v}`}
              >
                {v}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
