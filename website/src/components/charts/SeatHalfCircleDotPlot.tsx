import { PARTY_BY_CODE, partyColor } from "@/data/parties";
import type { ModelSummaryDatum } from "@/components/charts/ModelSummaryBarChart";

type SeatHalfCircleDotPlotProps = {
  data: ModelSummaryDatum[];
};

type SeatAllocation = {
  partyCode: string;
  partyName: string;
  meanSeats: number;
  seats: number;
  lowerBound: number | null;
  upperBound: number | null;
};

type Dot = {
  x: number;
  y: number;
  color: string;
  partyCode: string;
};

type DotPosition = {
  x: number;
  y: number;
  angle: number;
  radius: number;
};

const ROW_CAPACITIES = [42, 34, 29, 24, 20, 15, 11];

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function allocateSeats(data: ModelSummaryDatum[]): SeatAllocation[] {
  const sorted = [...data]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => {
      const aScale = PARTY_BY_CODE[a.partyCode]?.leftRightScale ?? Number.POSITIVE_INFINITY;
      const bScale = PARTY_BY_CODE[b.partyCode]?.leftRightScale ?? Number.POSITIVE_INFINITY;
      return aScale - bScale || b.value - a.value;
    });

  const targetSeats = Math.round(sorted.reduce((sum, entry) => sum + entry.value, 0));
  const base = sorted.map((entry) => ({
    ...entry,
    floored: Math.floor(entry.value),
    remainder: entry.value - Math.floor(entry.value),
  }));

  let remaining = targetSeats - base.reduce((sum, entry) => sum + entry.floored, 0);

  const increments = [...base]
    .sort((a, b) => b.remainder - a.remainder)
    .map((entry) => entry.partyCode);

  const allocationByParty = new Map(base.map((entry) => [entry.partyCode, entry.floored]));

  for (let index = 0; index < increments.length && remaining > 0; index += 1) {
    const partyCode = increments[index];
    allocationByParty.set(partyCode, (allocationByParty.get(partyCode) ?? 0) + 1);
    remaining -= 1;
  }

  return sorted.map((entry) => ({
    partyCode: entry.partyCode,
    partyName: entry.partyName,
    meanSeats: entry.value,
    seats: allocationByParty.get(entry.partyCode) ?? 0,
    lowerBound: entry.lowerBound,
    upperBound: entry.upperBound,
  }));
}

function buildDots(data: SeatAllocation[]): Dot[] {
  const width = 700;
  const height = 420;
  const centerX = width / 2;
  const baselineY = height - 28;
  const outerRadius = 300;
  const rowGap = 34;
  const seatColors = data.flatMap((entry) => Array.from({ length: entry.seats }, () => ({
    color: partyColor(entry.partyCode),
    partyCode: entry.partyCode,
  })));

  const positions: DotPosition[] = [];

  ROW_CAPACITIES.forEach((capacity, rowIndex) => {
    const radius = outerRadius - rowIndex * rowGap;

    for (let dotIndex = 0; dotIndex < capacity; dotIndex += 1) {
      const angle = Math.PI - ((dotIndex + 0.5) / capacity) * Math.PI;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: baselineY - Math.sin(angle) * radius,
        angle,
        radius,
      });
    }
  });

  const orderedPositions = positions
    .sort((a, b) => {
      // Fill by chamber slice first so party colors form vertical bands.
      if (Math.abs(a.angle - b.angle) > 0.0001) return b.angle - a.angle;
      return b.radius - a.radius;
    })
    .slice(0, seatColors.length);

  return orderedPositions.map((position, index) => ({
    x: position.x,
    y: position.y,
    color: seatColors[index].color,
    partyCode: seatColors[index].partyCode,
  }));
}

function buildPartyBackgrounds(dots: Dot[]) {
  const byParty = new Map<string, Dot[]>();

  dots.forEach((dot) => {
    const current = byParty.get(dot.partyCode) ?? [];
    current.push(dot);
    byParty.set(dot.partyCode, current);
  });

  return Array.from(byParty.entries()).map(([partyCode, partyDots]) => ({
    partyCode,
    color: partyColor(partyCode),
    dots: partyDots,
  }));
}

export function SeatHalfCircleDotPlot({ data }: SeatHalfCircleDotPlotProps) {
  const allocation = allocateSeats(data);
  const totalSeats = allocation.reduce((sum, entry) => sum + entry.seats, 0);
  const dots = buildDots(allocation);
  const partyBackgrounds = buildPartyBackgrounds(dots);
  const width = 700;
  const height = 420;
  const majoritySeats = 90;

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-3xl">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label="Halvcirkel med mandatfordeling"
        >
          <defs>
            <filter id="partyHalo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.2" />
            </filter>
            <filter id="partyHaloShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.6" stdDeviation="3.2" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>
          </defs>

          <path
            d={`M 50 ${height - 28} A 300 300 0 0 1 650 ${height - 28}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeDasharray="4 6"
          />

          {partyBackgrounds.map((background) => (
            <g key={background.partyCode} filter="url(#partyHaloShadow)">
              <g filter="url(#partyHalo)">
                {background.dots.map((dot, index) => (
                  <circle
                    key={`${background.partyCode}-halo-${index}`}
                    cx={dot.x}
                    cy={dot.y}
                    r="12.75"
                    fill={hexToRgba(background.color, background.partyCode === "O" ? 0.2 : 0.16)}
                  />
                ))}
              </g>
            </g>
          ))}

          {dots.map((dot, index) => (
            <circle
              key={`${dot.partyCode}-${index}`}
              cx={dot.x}
              cy={dot.y}
              r="7.5"
              fill={dot.color}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.75"
            />
          ))}

          <text x={width / 2} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[12px]">
            {totalSeats} mandater i alt · flertal ved {majoritySeats}
          </text>
        </svg>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {allocation.map((entry) => (
          <div
            key={entry.partyCode}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                style={{ backgroundColor: partyColor(entry.partyCode) }}
              >
                {entry.partyCode}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {PARTY_BY_CODE[entry.partyCode]?.shortName ?? entry.partyName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{entry.seats}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400">
        Hver prik er ét mandat. Halvcirklen er afrundet til hele mandater ud fra modellens gennemsnit og fordelt fra venstre mod højre efter partiernes ideologiske placering.
      </p>
    </div>
  );
}
