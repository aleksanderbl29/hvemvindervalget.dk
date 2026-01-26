"use client";

/**
 * Legacy Plotly component - kept for deep dive analysis at a later time.
 * This component is not used in the main application but preserved for reference.
 */

import { memo, useEffect } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist";
import type { Data } from "plotly.js";
import { logClientEvent } from "@/lib/telemetry";

const Plot = createPlotlyComponent(Plotly);

export type PlotlyFigureProps = {
  spec: {
    version: string;
    data: unknown[];
    layout?: Record<string, unknown>;
    config?: Record<string, unknown>;
  };
  ariaLabel?: string;
};

function PlotlyFigureComponent({ spec, ariaLabel }: PlotlyFigureProps) {
  const traceCount = Array.isArray(spec.data) ? spec.data.length : 0;

  useEffect(() => {
    logClientEvent("chart:plotly:init", {
      chartId: ariaLabel,
      traceCount,
    });
  }, [ariaLabel, traceCount]);

  return (
    <Plot
      data={spec.data as unknown as Data[]}
      layout={{
        ...spec.layout,
        autosize: true,
        margin: {
          t: 48,
          r: 32,
          b: 48,
          l: 48,
          ...(spec.layout?.margin as Record<string, number>),
        },
        font: {
          family: "Montserrat, sans-serif",
          ...(spec.layout?.font as Record<string, unknown>),
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
      }}
      config={{
        displaylogo: false,
        responsive: true,
        ...spec.config,
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      className="h-[360px] w-full md:h-[540px] lg:h-[640px]"
      aria-label={ariaLabel}
    />
  );
}

export const PlotlyFigure = memo(PlotlyFigureComponent);
