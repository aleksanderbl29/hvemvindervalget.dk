"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { ChartLibraryId, ChartSummary } from "@/lib/api/types";
import { logClientEvent } from "@/lib/telemetry";
import { resolveChartLibrary } from "@/lib/charts/registry";

const PlotlyFigure = dynamic(
  () => import("./PlotlyFigure").then((mod) => mod.PlotlyFigure),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center text-sm text-slate-500">
        Indlæser Plotly-graf ...
      </div>
    ),
  },
);

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
      traceCount: Array.isArray(chart.plotlySpec?.data) ? chart.plotlySpec.data.length : 0,
    });
  }, [chart.id, chart.library, chart.plotlySpec?.data, preferredLibrary, resolvedLibrary.id]);

  if (resolvedLibrary.id === "plotly" && chart.plotlySpec) {
    return (
      <div className="h-[320px] w-full">
        <PlotlyFigure spec={chart.plotlySpec} ariaLabel={chart.title} />
      </div>
    );
  }

  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
      <p>
        {resolvedLibrary.label} er markeret som “{resolvedLibrary.status}” -
        adapteren er ikke klar endnu.
      </p>
      <p>Registreret diagram-id: {chart.id}</p>
    </div>
  );
}


