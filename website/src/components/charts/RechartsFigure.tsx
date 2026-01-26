"use client";

import { memo, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { logClientEvent } from "@/lib/telemetry";

type ChartData = {
  date?: string;
  x?: string | number;
  [key: string]: string | number | undefined;
};

type RechartsFigureProps = {
  chartData: {
    type: "line" | "bar";
    series: Array<{
      name: string;
      data: Array<{ date?: string; x?: string | number; value: number }>;
      color?: string;
    }>;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
  ariaLabel?: string;
};

// Default party colors (matching your existing color scheme)
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

function RechartsFigureComponent({ chartData, ariaLabel }: RechartsFigureProps) {
  // Transform data for Recharts format
  const transformedData = useMemo(() => {
    if (chartData.series.length === 0) return [];

    // Get all unique x values (dates or categories)
    const xValues = new Set<string | number>();
    chartData.series.forEach((series) => {
      series.data.forEach((point) => {
        const x = point.date ?? point.x;
        if (x !== undefined) xValues.add(x);
      });
    });

    // Create data points for each x value
    const data: ChartData[] = Array.from(xValues)
      .sort((a, b) => {
        // Sort dates chronologically, categories alphabetically
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

        // Add value for each series at this x value
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
  }, [chartData.series]);

  const seriesCount = chartData.series.length;

  // Log chart initialization
  useMemo(() => {
    if (typeof window !== "undefined") {
      logClientEvent("chart:recharts:init", {
        chartId: ariaLabel,
        seriesCount,
        chartType: chartData.type,
      });
    }
  }, [ariaLabel, seriesCount, chartData.type]);

  const ChartComponent = chartData.type === "line" ? LineChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComponent
        data={transformedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        aria-label={ariaLabel}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey={chartData.series[0]?.data[0]?.date ? "date" : "x"}
          stroke="#64748b"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: "12px" }}
          label={
            chartData.xAxisLabel
              ? {
                  value: chartData.xAxisLabel,
                  position: "insideBottom",
                  offset: -5,
                  style: { fontFamily: "Montserrat, sans-serif" },
                }
              : undefined
          }
        />
        <YAxis
          stroke="#64748b"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: "12px" }}
          label={
            chartData.yAxisLabel
              ? {
                  value: chartData.yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontFamily: "Montserrat, sans-serif" },
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontFamily: "Montserrat, sans-serif",
          }}
        />
        {chartData.series.length > 1 && (
          <Legend
            wrapperStyle={{ fontFamily: "Montserrat, sans-serif" }}
          />
        )}
        {chartData.series.map((series, index) => {
          const Component = chartData.type === "line" ? Line : Bar;
          const color = series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <Component
              key={series.name}
              type={chartData.type === "line" ? "monotone" : undefined}
              dataKey={series.name}
              stroke={color}
              fill={color}
              strokeWidth={2}
              dot={chartData.type === "line" ? { r: 4 } : false}
              activeDot={chartData.type === "line" ? { r: 6 } : undefined}
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

export const RechartsFigure = memo(RechartsFigureComponent);
