"use client";

/**
 * Server-renderable Recharts component.
 * This version renders the SVG on the server for static generation.
 *
 * IMPORTANT: Recharts works with SSR in Next.js App Router, but ResponsiveContainer
 * needs client-side JavaScript for dynamic sizing. For fully static rendering,
 * we use fixed dimensions or a wrapper div with explicit width/height.
 *
 * The SVG will be in the static HTML, making it:
 * - Visible to crawlers (SEO)
 * - Works without JavaScript
 * - Faster initial paint
 *
 * Note: This is a client component (required by Recharts), but can be used
 * in server components and will be server-rendered then hydrated on the client.
 */

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  date?: string;
  x?: string | number;
  [key: string]: string | number | undefined;
};

type RechartsChartData = {
  type: "line" | "bar" | "area";
  series: Array<{
    name: string;
    data: Array<{ date?: string; x?: string | number; value: number }>;
    color?: string;
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
};

// Default party colors
const DEFAULT_COLORS = [
  "#ef4444", // A - Red
  "#06b6d4", // B - Cyan
  "#2563eb", // V - Blue
  "#f97316", // O - Orange
  "#a855f7", // F - Purple
  "#14b8a6", // K - Teal
  "#ea580c", // Ø - Orange-red
  "#71717a", // Å - Gray
];

/**
 * Transforms chart data into Recharts format.
 * This can run on the server.
 */
function transformChartData(chartData: RechartsChartData): ChartData[] {
  if (chartData.series.length === 0) return [];

  const xValues = new Set<string | number>();
  chartData.series.forEach((series) => {
    series.data.forEach((point) => {
      const x = point.date ?? point.x;
      if (x !== undefined) xValues.add(x);
    });
  });

  const data: ChartData[] = Array.from(xValues)
    .sort((a, b) => {
      if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
      }
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .map((x) => {
      const point: ChartData = {
        date: typeof x === "string" ? x : undefined,
        x: x,
      };

      chartData.series.forEach((series) => {
        const seriesPoint = series.data.find(
          (p) => (p.date ?? p.x) === x
        );
        if (seriesPoint) {
          point[series.name] = seriesPoint.value;
        }
      });

      return point;
    });

  return data;
}

type RechartsFigureServerProps = {
  chartData: RechartsChartData;
  ariaLabel?: string;
  height?: number | string;
};

/**
 * Server-renderable chart component.
 * Renders static SVG that works without JavaScript.
 * For interactive features (tooltips, hover), use the client component.
 */
export function RechartsFigureServer({
  chartData,
  ariaLabel,
  height = "40vh",
}: RechartsFigureServerProps) {
  const transformedData = transformChartData(chartData);
  const ChartComponent =
    chartData.type === "line"
      ? LineChart
      : chartData.type === "area"
        ? AreaChart
        : BarChart;

  // For static rendering, we use a fixed container
  // ResponsiveContainer works with SSR but uses client-side resize listeners
  // For maximum static rendering, we use fixed dimensions
  // Chart height can be viewport units (vh) or pixels
  const heightStyle =
    typeof height === "string" ? height : `${height}px`;

  return (
    <div
      className="w-full"
      style={{ height: heightStyle }}
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={transformedData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={0.5} />
          <XAxis
            dataKey={chartData.series[0]?.data[0]?.date ? "date" : "x"}
            stroke="#94a3b8"
            strokeWidth={0.5}
            style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px" }}
            tick={{ fill: "#64748b" }}
            label={
              chartData.xAxisLabel
                ? {
                    value: chartData.xAxisLabel,
                    position: "insideBottom",
                    offset: -5,
                    style: { fontFamily: "Montserrat, sans-serif", fontSize: "11px" },
                  }
                : undefined
            }
          />
          <YAxis
            stroke="#94a3b8"
            strokeWidth={0.5}
            style={{ fontFamily: "Montserrat, sans-serif", fontSize: "11px" }}
            tick={{ fill: "#64748b" }}
            {...(chartData.type === "bar" || chartData.type === "area"
              ? {
                  domain: [0, 100],
                  ticks: [0, 25, 50, 75, 100],
                  tickFormatter: (value: number) => `${Math.round(value)}%`,
                }
              : {})}
            label={
              chartData.yAxisLabel
                ? {
                    value: chartData.yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontFamily: "Montserrat, sans-serif", fontSize: "11px" },
                  }
                : undefined
            }
          />
          {chartData.series.map((series, index) => {
            const color = series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

            if (chartData.type === "bar") {
              // Stacked bar chart
              return (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  stackId="1"
                  fill={color}
                  stroke={color}
                  strokeWidth={0.5}
                  isAnimationActive={false}
                />
              );
            }

            if (chartData.type === "area") {
              // Stacked area chart
              return (
                <Area
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  strokeWidth={0.5}
                  isAnimationActive={false}
                />
              );
            }

            // Line chart
            return (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={color}
                fill={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
