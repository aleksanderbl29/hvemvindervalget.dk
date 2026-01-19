import { runtimeConfig } from "../config";
import type { ChartLibraryId } from "../api/types";

export type ChartLibraryStatus = "ready" | "beta" | "planned";

export type ChartLibraryMeta = {
  id: ChartLibraryId;
  label: string;
  description: string;
  strengths: string[];
  status: ChartLibraryStatus;
};

const registry: Record<ChartLibraryId, ChartLibraryMeta> = {
  plotly: {
    id: "plotly",
    label: "Plotly.js",
    description:
      "Feature-rich, supports declarative specs exported from R/Python notebooks, excellent for statistical charts.",
    strengths: ["Declarative specs", "Server-export friendly", "Large trace catalog"],
    status: "ready",
  },
  echarts: {
    id: "echarts",
    label: "Apache ECharts",
    description:
      "High-performance canvas renderer with strong geo support and built-in theming suitable for dense dashboards.",
    strengths: ["Geo layers", "Canvas/SVG switch", "Rich theming"],
    status: "planned",
  },
  chartjs: {
    id: "chartjs",
    label: "Chart.js",
    description:
      "Lightweight charts for simpler widgets; great for quick sparkline style visuals or fallback when bundle budgets matter.",
    strengths: ["Small bundle", "Great defaults", "Plugin ecosystem"],
    status: "planned",
  },
  "vega-lite": {
    id: "vega-lite",
    label: "Vega-Lite",
    description:
      "Grammar-of-graphics approach with good interoperability with analysis tooling; future candidate for templated charts.",
    strengths: ["Composable grammar", "Strong accessibility", "Spec portability"],
    status: "planned",
  },
};

export const chartLibraries: ChartLibraryMeta[] = Object.values(registry);

export function getChartLibraryMeta(id: ChartLibraryId): ChartLibraryMeta {
  return registry[id];
}

export function resolveChartLibrary(preferred?: ChartLibraryId): ChartLibraryMeta {
  if (preferred && registry[preferred]) {
    return registry[preferred];
  }
  return registry[runtimeConfig.chartLibrary] ?? registry.plotly;
}


