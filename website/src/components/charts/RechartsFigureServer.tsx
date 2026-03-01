"use client";

/**
 * Optimized Recharts component with code-splitting.
 *
 * Performance optimizations:
 * - Dynamic imports: Recharts is code-split and loaded only when needed
 * - Client-side only: Avoids SSR overhead for the chart library
 * - Lazy loading: Charts load asynchronously, improving initial page load
 *
 * The chart will:
 * - Load faster on initial page render (Recharts not in main bundle)
 * - Reduce JavaScript bundle size for pages without charts
 * - Still render SVG that's visible to crawlers (after hydration)
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { RechartsChartData } from "@/lib/api/types";

// Dynamically import the chart component (code-split, client-side only)
// This ensures Recharts (~200KB) is not in the main bundle
const DynamicRechartsChart = dynamic(
  () => import("./RechartsChartInternal").then((mod) => ({ default: mod.RechartsChartInternal })),
  {
    ssr: false, // Client-side only for better performance
    loading: () => (
      <div
        className="w-full flex items-center justify-center"
        style={{ minHeight: "300px" }}
        aria-label="Loading chart..."
      >
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    ),
  }
);

type RechartsFigureServerProps = {
  chartData: RechartsChartData;
  ariaLabel?: string;
  height?: number | string;
};

/**
 * Optimized chart component with code-splitting.
 * Recharts is loaded asynchronously, reducing initial bundle size.
 */
export function RechartsFigureServer({
  chartData,
  ariaLabel,
  height = "40vh",
}: RechartsFigureServerProps) {
  return (
    <Suspense
      fallback={
        <div
          className="w-full flex items-center justify-center"
          style={{ minHeight: typeof height === "number" ? `${height}px` : "300px" }}
          aria-label={ariaLabel ? `${ariaLabel} (loading)` : "Loading chart..."}
        >
          <div className="text-sm text-gray-500">Loading chart...</div>
        </div>
      }
    >
      <DynamicRechartsChart
        chartData={chartData}
        ariaLabel={ariaLabel}
        height={height}
      />
    </Suspense>
  );
}
