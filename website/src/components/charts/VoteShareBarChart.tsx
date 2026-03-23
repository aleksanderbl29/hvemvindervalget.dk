import { PARTY_BY_CODE, partyColor } from "@/data/parties";
import type { ModelSummaryDatum } from "@/components/charts/ModelSummaryBarChart";

type VoteShareBarChartProps = {
  data: ModelSummaryDatum[];
};

function roundUpToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function formatPercent(value: number | null): string {
  if (value === null) return "–";
  return `${value.toFixed(1)}%`;
}

export function VoteShareBarChart({ data }: VoteShareBarChartProps) {
  const sortedData = [...data]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => {
      const aScale = PARTY_BY_CODE[a.partyCode]?.leftRightScale ?? Number.POSITIVE_INFINITY;
      const bScale = PARTY_BY_CODE[b.partyCode]?.leftRightScale ?? Number.POSITIVE_INFINITY;
      return aScale - bScale || b.value - a.value;
    });

  const chartHeight = 340;
  const chartWidth = Math.max(820, sortedData.length * 64 + 120);
  const margin = { top: 18, right: 24, bottom: 84, left: 48 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const yAxisMax = roundUpToStep(
    Math.max(...sortedData.map((entry) => Math.max(entry.value, entry.upperBound ?? entry.value)), 20),
    5,
  );
  const slotWidth = innerWidth / Math.max(sortedData.length, 1);
  const barWidth = Math.min(34, slotWidth * 0.58);
  const tickValues = Array.from({ length: Math.floor(yAxisMax / 5) + 1 }, (_, index) => index * 5);
  const cutoffValue = 2;
  const cutoffY = margin.top + innerHeight - (cutoffValue / yAxisMax) * innerHeight;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-w-[820px] w-full"
          role="img"
          aria-label="Soejlediagram over partiernes forventede stemmeandele"
        >
          {tickValues.map((tick) => {
            const y = margin.top + innerHeight - (tick / yAxisMax) * innerHeight;

            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + innerWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          <line
            x1={margin.left}
            y1={margin.top + innerHeight}
            x2={margin.left + innerWidth}
            y2={margin.top + innerHeight}
            stroke="#94a3b8"
            strokeWidth="1"
          />

          <line
            x1={margin.left}
            y1={cutoffY}
            x2={margin.left + innerWidth}
            y2={cutoffY}
            stroke="#0f172a"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.45"
          />
          <text
            x={margin.left + innerWidth - 4}
            y={cutoffY - 6}
            textAnchor="end"
            className="fill-slate-600 text-[10px] font-medium"
          >
            2% spærregrænse
          </text>

          {sortedData.map((entry, index) => {
            const xCenter = margin.left + slotWidth * index + slotWidth / 2;
            const barHeight = (entry.value / yAxisMax) * innerHeight;
            const barX = xCenter - barWidth / 2;
            const barY = margin.top + innerHeight - barHeight;
            const lowerBound = entry.lowerBound ?? entry.value;
            const upperBound = entry.upperBound ?? entry.value;
            const whiskerTop = margin.top + innerHeight - (upperBound / yAxisMax) * innerHeight;
            const whiskerBottom = margin.top + innerHeight - (lowerBound / yAxisMax) * innerHeight;
            const color = partyColor(entry.partyCode);
            const label = PARTY_BY_CODE[entry.partyCode]?.shortName ?? entry.partyName;
            const valueLabelY = Math.max(margin.top + 12, Math.min(barY, whiskerTop) - 18);

            return (
              <g key={entry.partyCode}>
                <line
                  x1={xCenter}
                  y1={whiskerTop}
                  x2={xCenter}
                  y2={whiskerBottom}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={xCenter - 7}
                  y1={whiskerTop}
                  x2={xCenter + 7}
                  y2={whiskerTop}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={xCenter - 7}
                  y1={whiskerBottom}
                  x2={xCenter + 7}
                  y2={whiskerBottom}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={xCenter}
                  y1={whiskerTop}
                  x2={xCenter}
                  y2={whiskerBottom}
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1={xCenter - 7}
                  y1={whiskerTop}
                  x2={xCenter + 7}
                  y2={whiskerTop}
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1={xCenter - 7}
                  y1={whiskerBottom}
                  x2={xCenter + 7}
                  y2={whiskerBottom}
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx="6"
                  fill={color}
                  opacity="0.88"
                />
                <text
                  x={xCenter}
                  y={valueLabelY}
                  textAnchor="middle"
                  className="fill-slate-800 text-[11px] font-semibold"
                >
                  {formatPercent(entry.value)}
                </text>
                <text
                  x={xCenter}
                  y={margin.top + innerHeight + 18}
                  textAnchor="middle"
                  className="fill-slate-800 text-[11px] font-semibold"
                >
                  {entry.partyCode}
                </text>
                <text
                  x={xCenter}
                  y={margin.top + innerHeight + 34}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {label.length > 12 ? `${label.slice(0, 12)}.` : label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] text-slate-400">
        Søjlerne viser modellens gennemsnitlige stemmeandel. Stregerne viser intervallet fra 10. til 90. percentil.
      </p>
    </div>
  );
}
