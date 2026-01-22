export const metadata = {
  title: "Meningsmålinger | Hvem vinder valget?",
};

import { ChartShell } from "@/components/ui/ChartShell";
import type { ChartSummary } from "@/lib/api/types";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadChartJson(): Promise<ChartSummary | null> {
  const chartPath = path.join("src/data/charts/chart.json");

  try {
    const raw = await readFile(chartPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    // `chart.json` may be exported as `["{...}"]` (array containing JSON string).
    const plotlyPayload =
      Array.isArray(parsed) && typeof parsed[0] === "string"
        ? (JSON.parse(parsed[0]) as unknown)
        : parsed;

    if (process.env.NODE_ENV === "development") {
      const keys =
        plotlyPayload && typeof plotlyPayload === "object"
          ? Object.keys(plotlyPayload as Record<string, unknown>)
          : [];
      const traceCount =
        plotlyPayload &&
        typeof plotlyPayload === "object" &&
        Array.isArray((plotlyPayload as { data?: unknown }).data)
          ? ((plotlyPayload as { data: unknown[] }).data.length ?? 0)
          : 0;

      console.info("[polls] loaded chart.json", {
        chartPath,
        parsedType: Array.isArray(parsed) ? "array" : typeof parsed,
        plotlyKeys: keys.slice(0, 12),
        traceCount,
      });
    }

    const payloadObj =
      plotlyPayload && typeof plotlyPayload === "object"
        ? (plotlyPayload as Record<string, unknown>)
        : null;

    const plotlySpec: ChartSummary["plotlySpec"] = {
      version: "chart.json",
      data: Array.isArray(payloadObj?.data) ? (payloadObj.data as unknown[]) : [],
      layout:
        payloadObj?.layout && typeof payloadObj.layout === "object"
          ? (payloadObj.layout as Record<string, unknown>)
          : undefined,
      config:
        payloadObj?.config && typeof payloadObj.config === "object"
          ? (payloadObj.config as Record<string, unknown>)
          : undefined,
    };

    return {
      id: "polls:chart.json",
      title: "Meningsmålinger (chart.json)",
      description: "Plotly-spec indlæst fra chart.json i repo-root.",
      library: "plotly",
      updatedAt: new Date().toISOString(),
      dataSource: "chart.json (local file)",
      unit: "",
      tags: ["polls", "local"],
      plotlySpec,
    };
  } catch (error) {
    console.error("[polls] failed to load chart.json", { chartPath, error });
    return null;
  }
}

export default async function PollsPage() {
  const chart = await loadChartJson();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Meningsmålinger</h1>
      <p className="mt-2 text-sm text-slate-600">
        Live rendering af Plotly-spec fra <code className="rounded bg-slate-100 px-1">chart.json</code>.
      </p>

      <div className="mt-8">
        <ChartShell
          title="Plot"
          description="Indlæst lokalt fra chart.json og renderet med Plotly."
          chart={chart ?? undefined}
        >
          Kunne ikke indlæse <code className="rounded bg-slate-100 px-1">chart.json</code>.
        </ChartShell>
      </div>
    </main>
  );
}

