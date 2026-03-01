"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RechartsChartData } from "@/lib/api/types";
import { PARTY_BY_CODE, partyColor } from "@/data/parties";

type ChartRow = {
  date: string;
  [partyCode: string]: string | number;
};

function buildChartRows(chartData: RechartsChartData): ChartRow[] {
  const dateSet = new Set<string>();
  chartData.series.forEach((s) => {
    s.data.forEach((pt) => {
      if (pt.date) dateSet.add(pt.date);
    });
  });
  return Array.from(dateSet)
    .sort()
    .map((date) => {
      const row: ChartRow = { date };
      chartData.series.forEach((s) => {
        const pt = s.data.find((p) => p.date === date);
        if (pt !== undefined) row[s.name] = pt.value;
      });
      return row;
    });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type SyncFn = (label: string | null, values: Record<string, number> | null) => void;

/**
 * Invisible Recharts tooltip content component.
 * Recharts injects `active`, `payload`, and `label` as props on every hover frame.
 * We read those and push the data up to the parent via `onSync`.
 *
 * The `syncKey` trick prevents re-firing when the parent re-renders due to
 * our own setState call (payload ref changes but meaningful content is the same).
 */
function SyncTooltip({
  active,
  payload,
  label,
  onSync,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: unknown }>;
  label?: string;
  onSync: SyncFn;
}) {
  const syncKey = `${active}:${label}:${payload?.length ?? 0}`;
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useLayoutEffect(() => {
    if (active && payload?.length && label !== undefined) {
      const values: Record<string, number> = {};
      payload.forEach((p) => {
        if (typeof p.dataKey === "string" && typeof p.value === "number") {
          values[p.dataKey] = p.value;
        }
      });
      if (Object.keys(values).length) {
        onSyncRef.current(label, values);
        return;
      }
    }
    onSyncRef.current(null, null);
  }, [syncKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

type PollsLineChartProps = {
  chartData: RechartsChartData;
  height?: string;
};

export function PollsLineChart({ chartData, height = "38vh" }: PollsLineChartProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const rows = useMemo(() => buildChartRows(chartData), [chartData]);

  const latestValues = useMemo<Record<string, number>>(() => {
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return {};
    const result: Record<string, number> = {};
    chartData.series.forEach((s) => {
      const v = lastRow[s.name];
      if (typeof v === "number") result[s.name] = v;
    });
    return result;
  }, [rows, chartData.series]);

  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [displayValues, setDisplayValues] = useState<Record<string, number>>(latestValues);

  // Keep badges in sync with latest poll when not hovering
  const latestValuesRef = useRef(latestValues);
  latestValuesRef.current = latestValues;

  const handleSync = useRef<SyncFn>(() => {}).current;
  // Reassign via ref so SyncTooltip always calls the latest version
  const handleSyncImpl = useRef<SyncFn>((label, values) => {
    if (label && values) {
      setHoveredLabel(label);
      setDisplayValues(values);
    } else {
      setHoveredLabel(null);
      setDisplayValues(latestValuesRef.current);
    }
  });
  // Give SyncTooltip a stable reference
  const stableOnSync = useRef<SyncFn>((l, v) => handleSyncImpl.current(l, v)).current;

  // If latestValues changes (chart data reload), reset when not hovering
  useEffect(() => {
    if (!hoveredLabel) setDisplayValues(latestValues);
  }, [latestValues, hoveredLabel]);

  const sortedParties = useMemo(
    () =>
      chartData.series
        .map((s) => ({
          code: s.name,
          value: displayValues[s.name] ?? null,
          color: s.color ?? partyColor(s.name),
        }))
        .filter((p) => p.value !== null && (p.value as number) > 0)
        .sort((a, b) => (b.value as number) - (a.value as number)),
    [chartData.series, displayValues],
  );

  const xTickFormatter = (val: string) => {
    const d = new Date(val);
    return d.toLocaleDateString("da-DK", { month: "short", year: "2-digit" });
  };

  // Stable SyncTooltip element — recreating it would unmount/remount the component
  // and break the useLayoutEffect sync on every render.
  const tooltipContent = useMemo(
    () => <SyncTooltip onSync={stableOnSync} />,
    [stableOnSync],
  );

  return (
    <div className="space-y-5">
      {/* Chart */}
      <div style={{ height, minHeight: "280px" }} className="w-full">
        {!ready ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={0.5} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                strokeWidth={0.5}
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Montserrat, sans-serif" }}
                tickFormatter={xTickFormatter}
                minTickGap={40}
              />
              <YAxis
                stroke="#94a3b8"
                strokeWidth={0.5}
                tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Montserrat, sans-serif" }}
                tickFormatter={(v: number) => `${v}%`}
                width={38}
              />
              <Tooltip
                content={tooltipContent}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              {chartData.series.map((s) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color ?? partyColor(s.name)}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Date label */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>
          {hoveredLabel ? (
            <span className="font-medium text-slate-600">{formatDate(hoveredLabel)}</span>
          ) : (
            <span>
              Seneste måling –{" "}
              {rows[rows.length - 1]?.date ? formatDate(rows[rows.length - 1].date) : ""}
            </span>
          )}
        </span>
        <span className="italic">Stemmeandele i %</span>
      </div>

      {/* Party badges */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {sortedParties.map(({ code, value, color }) => {
          const party = PARTY_BY_CODE[code];
          const isLight = isLightColor(color);
          return (
            <div
              key={code}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5 shadow-sm"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded font-bold text-xs"
                style={{ backgroundColor: color, color: isLight ? "#1e293b" : "#ffffff" }}
              >
                {code}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[10px] leading-tight text-slate-500">
                  {party?.shortName ?? code}
                </div>
                <div className="text-sm font-semibold leading-tight text-slate-800">
                  {value !== null ? `${(value as number).toFixed(1)}%` : "–"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Returns true if a hex color is perceptually light (use dark text on it). */
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 160;
}
