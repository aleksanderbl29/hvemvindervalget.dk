"use client";

import { useState, useLayoutEffect, useMemo, useRef, useCallback, useSyncExternalStore } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import Image from "next/image";
import type { RechartsChartData } from "@/lib/api/types";
import { PARTY_BY_CODE, partyColor } from "@/data/parties";
import { getPollster } from "@/data/pollsters";

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

const ELECTION_ANNOUNCED_DATE = "2026-02-26";

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
  useLayoutEffect(() => {
    onSyncRef.current = onSync;
  });

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
  /** date string → pollster names for that date, pre-built on the server */
  pollstersByDate?: Record<string, string[]>;
  height?: string;
};

export function PollsLineChart({ chartData, pollstersByDate = {}, height = "38vh" }: PollsLineChartProps) {
  // useSyncExternalStore is the React-canonical way to detect client vs. server
  // without an effect: server snapshot → false (skeleton), client snapshot → true (chart).
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  const rows = useMemo(() => {
    const base = buildChartRows(chartData);
    // ReferenceLine on a categorical XAxis only renders when the x value exists
    // in the data array — inject the date as a data-less row if absent.
    if (!base.find((r) => r.date === ELECTION_ANNOUNCED_DATE)) {
      const insertAt = base.findIndex((r) => r.date > ELECTION_ANNOUNCED_DATE);
      const refRow: ChartRow = { date: ELECTION_ANNOUNCED_DATE };
      if (insertAt === -1) base.push(refRow);
      else base.splice(insertAt, 0, refRow);
    }
    return base;
  }, [chartData]);

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
  const [hoveredValues, setHoveredValues] = useState<Record<string, number>>({});

  // Locked state: clicking a point pins the display to that date
  const [lockedLabel, setLockedLabel] = useState<string | null>(null);
  const [lockedValues, setLockedValues] = useState<Record<string, number> | null>(null);

  // Derived — no separate state or sync effect needed; always reflects the right source
  const displayValues = useMemo(() => {
    if (hoveredLabel !== null) return hoveredValues;
    if (lockedLabel !== null && lockedValues !== null) return lockedValues;
    return latestValues;
  }, [hoveredLabel, hoveredValues, lockedLabel, lockedValues, latestValues]);

  // Track the current hovered position via refs so click handler can read it
  // without relying on Recharts' onClick payload (which can arrive empty).
  const hoveredLabelRef = useRef<string | null>(null);
  const hoveredValuesRef = useRef<Record<string, number>>({});

  // Reassign via ref so SyncTooltip always calls the latest version
  const handleSyncImpl = useRef<SyncFn>((label, values) => {
    if (label && values) {
      hoveredLabelRef.current = label;
      hoveredValuesRef.current = values;
      setHoveredLabel(label);
      setHoveredValues(values);
    } else {
      hoveredLabelRef.current = null;
      hoveredValuesRef.current = {};
      setHoveredLabel(null);
      // displayValues is derived — no explicit fallback needed
    }
  });
  // Give SyncTooltip a stable reference — handleSyncImpl is a ref so [] is safe
  const stableOnSync = useCallback<SyncFn>((l, v) => handleSyncImpl.current(l, v), []);

  // Recharts' onClick payload can arrive empty (tooltip deactivates on mousedown),
  // so we read the hovered position from refs instead — always up-to-date.
  const handleChartClick = () => {
    const label = hoveredLabelRef.current;
    if (!label) return; // cursor not over a data column

    if (label === lockedLabel) {
      // Toggle off
      setLockedLabel(null);
      setLockedValues(null);
    } else {
      const values = hoveredValuesRef.current;
      setLockedLabel(label);
      setLockedValues(values);
    }
  };

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

  // Pollsters for the currently displayed date (hovered → locked → latest)
  const displayDate = hoveredLabel ?? lockedLabel ?? rows[rows.length - 1]?.date ?? null;
  const activePollsterNames = displayDate ? (pollstersByDate[displayDate] ?? []) : [];
  const activePollsters = activePollsterNames.map(getPollster);

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
            <LineChart
              data={rows}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              onClick={handleChartClick}
              style={{ cursor: "pointer" }}
            >
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
              <ReferenceLine
                x={ELECTION_ANNOUNCED_DATE}
                stroke="#94a3b8"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: "Valg udskrevet",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#94a3b8",
                  fontFamily: "Montserrat, sans-serif",
                  dy: 4,
                }}
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
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Date + pollster row */}
      <div className="flex items-center justify-between gap-4 px-1">
        <span className="text-xs text-slate-400">
          {hoveredLabel ? (
            <span className="font-medium text-slate-600">{formatDate(hoveredLabel)}</span>
          ) : lockedLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3 text-slate-500"
              >
                <path
                  fillRule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5V4.5a2 2 0 1 0-4 0V6h4Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-slate-600">{formatDate(lockedLabel)}</span>
              <button
                onClick={() => {
                  setLockedLabel(null);
                  setLockedValues(null);
                }}
                className="ml-0.5 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Fjern lås"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </span>
          ) : (
            <span>
              Seneste måling –{" "}
              {displayDate ? formatDate(displayDate) : ""}
            </span>
          )}
        </span>

        {/* Pollster badge(s) */}
        <div className="flex items-center gap-2">
          {activePollsters.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-1.5 rounded-md border border-slate-100 bg-white px-2 py-1 shadow-sm"
              title={p.name}
            >
              <Image
                src={p.logoUrl}
                alt={p.shortName}
                width={16}
                height={16}
                className="rounded-sm"
              />
              <span className="text-xs font-medium text-slate-600">{p.shortName}</span>
            </div>
          ))}
        </div>
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

      <p className="mt-2 text-[11px] text-slate-400">
        Kun opstillingsberettigede partier vises
      </p>
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
