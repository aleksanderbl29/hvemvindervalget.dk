"use client";

import { useEffect } from "react";
import type { ChartLibraryId, ChartSummary } from "@/lib/api/types";
import { logClientEvent } from "@/lib/telemetry";
import { resolveChartLibrary } from "@/lib/charts/registry";

type ChartRendererProps = {
  chart: ChartSummary;
  preferredLibrary?: ChartLibraryId;
};

export function ChartRenderer({ chart, preferredLibrary }: ChartRendererProps) {
  if (typeof window === "undefined") {
    console.info("[chart] ChartRenderer invoked server-side", {
      chartId: chart.id,
      preferredLibrary: preferredLibrary ?? chart.library ?? null,
    });
  }

  const resolvedLibrary = resolveChartLibrary(preferredLibrary ?? chart.library);

  useEffect(() => {
    logClientEvent("chart:render:init", {
      chartId: chart.id,
      resolvedLibrary: resolvedLibrary.id,
      preferredLibrary: preferredLibrary ?? chart.library ?? null,
      seriesCount: chart.chartData?.series.length ?? 0,
    });
  }, [chart.id, chart.library, chart.chartData?.series, preferredLibrary, resolvedLibrary.id]);

  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
      <p>
        {resolvedLibrary.label} er markeret som "{resolvedLibrary.status}" -
        adapteren er ikke klar endnu.
      </p>
      <p>Registreret diagram-id: {chart.id}</p>
    </div>
  );
}
