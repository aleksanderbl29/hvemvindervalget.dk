"use client";

/**
 * Internal chart component that imports Recharts directly.
 * This file is code-split via dynamic import in RechartsFigureServer.
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
import type { RechartsChartData } from "@/lib/api/types";

type ChartData = {
  date?: string;
  x?: string | number;
  [key: string]: string | number | undefined;
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

export type RechartsChartInternalProps = {
  chartData: RechartsChartData;
  ariaLabel?: string;
  height?: number | string;
};

export function RechartsChartInternal({
  chartData,
  ariaLabel,
  height = "40vh",
}: RechartsChartInternalProps) {
  const transformedData = transformChartData(chartData);
  const ChartComponent =
    chartData.type === "line"
      ? LineChart
      : chartData.type === "area"
        ? AreaChart
        : BarChart;

  const heightStyle =
    typeof height === "string" ? height : `${height}px`;

  const minHeight = typeof height === "number"
    ? `${height}px`
    : height.includes("vh")
      ? "300px"
      : height;

  return (
    <div
      className="w-full"
      style={{ height: heightStyle, minHeight }}
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
              return (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  stackId="1"
                  fill={color}
                  stroke={color}
                  strokeWidth={0.5}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              );
            }

            if (chartData.type === "area") {
              return (
                <Area
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  strokeWidth={0.5}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              );
            }

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
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
