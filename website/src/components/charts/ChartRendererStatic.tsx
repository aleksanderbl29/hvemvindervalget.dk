/**
 * Server-renderable ChartRenderer for static generation.
 * This component can be used in server components and will render
 * charts as static SVG in the HTML.
 */

import { RechartsFigureServer } from "./RechartsFigureServer";
import type { ChartSummary, RechartsChartData } from "@/lib/api/types";

type ChartRendererStaticProps = {
  chart: ChartSummary;
};

/**
 * Server component that renders charts statically.
 * Supports Recharts (server-rendered).
 */
export async function ChartRendererStatic({ chart }: ChartRendererStaticProps) {
  // Check if chart has Recharts data format
  if (chart.library === "recharts" && chart.chartData) {
    return (
      <div className="h-[360px] w-full md:h-[540px] lg:h-[640px]">
        <RechartsFigureServer
          chartData={chart.chartData as RechartsChartData}
          ariaLabel={chart.title}
          height={640}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
      <p>Chart type not supported for static rendering</p>
      <p>Chart ID: {chart.id}</p>
    </div>
  );
}
