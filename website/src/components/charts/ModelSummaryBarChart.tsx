import { PARTY_BY_CODE, partyColor } from "@/data/parties";

export type ModelSummaryDatum = {
  partyCode: string;
  partyName: string;
  value: number;
  lowerBound: number | null;
  upperBound: number | null;
};

type ModelSummaryBarChartProps = {
  data: ModelSummaryDatum[];
  format: "percent" | "seats";
  rangeLabel?: string;
};

function formatValue(value: number, format: ModelSummaryBarChartProps["format"]): string {
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return value.toFixed(1);
}

function formatRange(
  lowerBound: number | null,
  upperBound: number | null,
  format: ModelSummaryBarChartProps["format"],
): string | null {
  if (lowerBound === null || upperBound === null) return null;
  return `${formatValue(lowerBound, format)} - ${formatValue(upperBound, format)}`;
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 160;
}

export function ModelSummaryBarChart({
  data,
  format,
  rangeLabel = "10.-90. percentil",
}: ModelSummaryBarChartProps) {
  const sortedData = [...data]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const maxValue = Math.max(
    ...sortedData.map((entry) => Math.max(entry.value, entry.upperBound ?? entry.value)),
    1,
  );

  return (
    <div className="space-y-3">
      {sortedData.map((entry, index) => {
        const party = PARTY_BY_CODE[entry.partyCode];
        const color = partyColor(entry.partyCode);
        const light = isLightColor(color);
        const meanWidth = (entry.value / maxValue) * 100;
        const lowerBound = entry.lowerBound ?? entry.value;
        const upperBound = entry.upperBound ?? entry.value;
        const intervalLeft = (Math.max(lowerBound, 0) / maxValue) * 100;
        const intervalWidth = (Math.max(upperBound - lowerBound, 0) / maxValue) * 100;
        const rangeText = formatRange(entry.lowerBound, entry.upperBound, format);

        return (
          <div
            key={entry.partyCode}
            className={`space-y-1.5 px-1 py-1.5 ${index === 0 ? "" : "border-t border-slate-100"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold"
                style={{ backgroundColor: color, color: light ? "#1e293b" : "#ffffff" }}
              >
                {entry.partyCode}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">
                  {party?.shortName ?? entry.partyName}
                </div>
                {rangeText ? (
                  <div className="text-xs text-slate-500">
                    {rangeLabel}: {rangeText}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">
                {formatValue(entry.value, format)}
              </div>
            </div>

            <div className="relative h-7 overflow-hidden rounded-sm bg-slate-100">
              {entry.lowerBound !== null && entry.upperBound !== null ? (
                <div
                  className="absolute inset-y-1 rounded-sm opacity-25"
                  style={{
                    left: `${intervalLeft}%`,
                    width: `${Math.max(intervalWidth, 1)}%`,
                    backgroundColor: color,
                  }}
                  aria-hidden="true"
                />
              ) : null}

              <div
                className="absolute inset-y-0 left-0 rounded-sm opacity-80"
                style={{
                  width: `${Math.max(meanWidth, 1)}%`,
                  backgroundColor: color,
                }}
                aria-hidden="true"
              />

              <div
                className="absolute inset-y-0 w-0.5 bg-slate-900/60"
                style={{ left: `${Math.min(meanWidth, 100)}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}

      <p className="pt-2 text-[11px] text-slate-400">
        Den mørke bjælke viser modellens gennemsnit, og den lyse markering viser {rangeLabel.toLowerCase()}.
      </p>
    </div>
  );
}
