"use client";

import { useMemo } from "react";
import { PARTY_BY_CODE, partyColor } from "@/data/parties";

export type WeightedPollEntry = {
  party_code: string;
  value: number;
  l_r_scale: number | null;
};

type SortBy = "size" | "left_right";

type Props = {
  data: WeightedPollEntry[];
  updatedAt?: string | null;
  sortBy?: SortBy;
  pollsters?: string[];
};

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 160;
}

export function WeightedPollsBarChart({ data, updatedAt, sortBy = "size", pollsters }: Props) {
  const sorted = useMemo(
    () =>
      [...data]
        .filter((d) => d.value > 0)
        .sort((a, b) => {
          if (sortBy === "left_right") {
            // Sort by left-right political scale
            if (a.l_r_scale !== null && b.l_r_scale !== null) {
              return a.l_r_scale - b.l_r_scale;
            }
            if (a.l_r_scale !== null) return -1;
            if (b.l_r_scale !== null) return 1;
            return a.party_code.localeCompare(b.party_code);
          }
          return b.value - a.value;
        }),
    [data, sortBy],
  );

  const maxValue = Math.max(...sorted.map((d) => d.value), 1);

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => {
        const party = PARTY_BY_CODE[entry.party_code];
        const color = partyColor(entry.party_code);
        const barPct = (entry.value / maxValue) * 100;
        const light = isLightColor(color);
        const isFirst = i === 0;

        return (
          <div
            key={entry.party_code}
            className={`flex items-center gap-3 px-1 py-[5px] ${isFirst ? "" : "border-t border-slate-100"}`}
          >
            {/* Party letter badge */}
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold"
              style={{ backgroundColor: color, color: light ? "#1e293b" : "#ffffff" }}
            >
              {entry.party_code}
            </div>

            {/* Party name */}
            <div className="w-40 shrink-0 truncate text-sm text-slate-700">
              {party?.shortName ?? entry.party_code}
            </div>

            {/* Bar track */}
            <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-slate-100">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: color,
                  opacity: 0.82,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Percentage */}
            <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">
              {entry.value.toFixed(1)}%
            </div>
          </div>
        );
      })}

      {(updatedAt || (pollsters && pollsters.length > 0)) && (
        <p className="pt-5 text-[11px] text-slate-400">
          {updatedAt && (
            <>
              Opdateret:{" "}
              {new Date(updatedAt).toLocaleDateString("da-DK", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
          {updatedAt && pollsters && pollsters.length > 0 && " · "}
          {pollsters && pollsters.length > 0 && (
            <>Baseret på data fra: {pollsters.join(", ")}</>
          )}
        </p>
      )}
    </div>
  );
}
