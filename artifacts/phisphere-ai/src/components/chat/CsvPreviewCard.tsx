import { useState, useMemo } from "react";
import { FileSpreadsheet, BarChart3, TrendingUp, Table2, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { CsvExpData } from "@/lib/experiment-types";
import { cn } from "@/lib/utils";

interface CsvPreviewCardProps {
  data: CsvExpData;
}

const LINE_COLORS = ["#00C9B1", "#6366F1", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

type ChartMode = "stats" | "line" | "bar";

export function CsvPreviewCard({ data }: CsvPreviewCardProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const topStats = Object.entries(data.stats ?? {}).slice(0, 4);
  const numericCols = data.numericColumns ?? [];

  const chartData = (data.preview ?? []).map((row, i) => {
    const entry: Record<string, number | string> = { row: i + 1 };
    for (const col of numericCols) {
      if (row[col] !== undefined) {
        const parsed = parseFloat(row[col]);
        if (!isNaN(parsed)) entry[col] = parsed;
      }
    }
    return entry;
  });

  const hasChartData = chartData.length > 0 && numericCols.length > 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-primary truncate">{data.filename}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground bg-black/30 px-2 py-0.5 rounded-full">
          {data.rowCount.toLocaleString()} rows · {data.columns.length} cols
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {data.columns.slice(0, 8).map((col) => (
          <span key={col} className="rounded-md bg-black/30 px-2 py-0.5 text-xs text-slate-300 border border-white/10">
            {col}
          </span>
        ))}
        {data.columns.length > 8 && (
          <span className="text-xs text-muted-foreground px-1">+{data.columns.length - 8} more</span>
        )}
      </div>

      {hasChartData && (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {(["line", "bar", "stats"] as ChartMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                  chartMode === mode
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                )}
              >
                {mode === "line" && <TrendingUp className="h-3 w-3" />}
                {mode === "bar" && <BarChart3 className="h-3 w-3" />}
                {mode === "stats" && <Table2 className="h-3 w-3" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {(chartMode === "line" || chartMode === "bar") && (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "line" ? (
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="row"
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "preview rows", position: "insideBottom", fill: "#475569", fontSize: 9, offset: -2 }}
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                    {numericCols.slice(0, 5).map((col, i) => (
                      <Line
                        key={col}
                        type="monotone"
                        dataKey={col}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="row" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                    {numericCols.slice(0, 3).map((col, i) => (
                      <Bar key={col} dataKey={col} fill={LINE_COLORS[i % LINE_COLORS.length]} radius={[2, 2, 0, 0]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {(chartMode === "stats" || !hasChartData) && topStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {topStats.map(([col, stat]) => (
            <div key={col} className="rounded-lg bg-black/20 px-3 py-2 border border-white/5">
              <div className="flex items-center gap-1 mb-0.5">
                <BarChart3 className="h-3 w-3 text-primary/60" />
                <span className="text-xs text-muted-foreground truncate">{col}</span>
              </div>
              <div className="text-xs text-slate-200 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">mean</span>
                  <span className="font-mono">{stat.mean.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">range</span>
                  <span className="font-mono text-xs">{stat.min}–{stat.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataQualityBanner data={data} />

      <p className="text-xs text-muted-foreground">
        Dataset attached — ask the AI to analyze trends, correlations, or anomalies.
      </p>
    </div>
  );
}

function DataQualityBanner({ data }: { data: CsvExpData }) {
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (data.rowCount < 30) w.push(`Small sample (${data.rowCount} rows) — results may be unreliable`);
    else if (data.rowCount < 100) w.push(`Moderate sample (${data.rowCount} rows)`);
    if ((data.numericColumns?.length ?? 0) === 0) w.push("No numeric columns — limited quantitative analysis");
    const hasMissing = (data.preview ?? []).some((row) =>
      Object.values(row).some((v) => v === "" || v === "null" || v === "NA" || v === "N/A" || v === "nan")
    );
    if (hasMissing) w.push("Missing values detected in preview");
    for (const [col, s] of Object.entries(data.stats ?? {})) {
      if (s.min === s.max) w.push(`'${col}' has zero variance`);
    }
    return w;
  }, [data]);

  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-[11px] font-semibold text-amber-400">Data Quality — Responsible AI</span>
      </div>
      <ul className="space-y-0.5">
        {warnings.map((w, i) => (
          <li key={i} className="text-[10px] text-amber-300/80 pl-4">• {w}</li>
        ))}
      </ul>
    </div>
  );
}
