export const metadata = {
  title: "Meningsmålinger | Hvem vinder valget?",
};

import { ChartShell } from "@/components/ui/ChartShell";
import type { ChartSummary } from "@/lib/api/types";
import { fetchLatestPlotlySpec } from "@/lib/api/plots";

export const runtime = "nodejs";

async function loadChartFromNeon(): Promise<ChartSummary | null> {
  const result = await fetchLatestPlotlySpec("polls");

  if (!result) {
    return null;
  }

  const { plotlySpec, lastUpdate, name } = result;

  return {
    id: `polls:${name}`,
    title: `Meningsmålinger (${name})`,
    description: "Plotly-spec indlæst fra Neon database.",
    library: "plotly",
    updatedAt: lastUpdate ?? new Date().toISOString(),
    dataSource: "Neon database (plots table)",
    unit: "",
    tags: ["polls", "neon"],
    plotlySpec,
  };
}

export default async function PollsPage() {
  const chart = await loadChartFromNeon();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Meningsmålinger</h1>
      <p className="mt-2 text-sm text-slate-600">
        Live rendering af Plotly-spec fra <code className="rounded bg-slate-100 px-1">Neon database</code>.
      </p>

      <div className="mt-8">
        <ChartShell
          title="Plot"
          description="Indlæst fra Neon database (plots table) og renderet med Plotly."
          chart={chart ?? undefined}
        >
          Kunne ikke indlæse plot fra Neon database.
        </ChartShell>
      </div>
    </main>
  );
}

