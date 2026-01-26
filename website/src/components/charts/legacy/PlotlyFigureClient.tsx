"use client";

import dynamic from "next/dynamic";
import type { PlotlyFigureProps } from "./PlotlyFigure";

// Dynamically import PlotlyFigure with SSR disabled since Plotly uses browser-only APIs
const PlotlyFigure = dynamic(
  () => import("./PlotlyFigure").then((mod) => ({ default: mod.PlotlyFigure })),
  { ssr: false }
);

export function PlotlyFigureClient(props: PlotlyFigureProps) {
  return <PlotlyFigure {...props} />;
}
