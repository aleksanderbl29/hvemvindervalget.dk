import { ChartShell } from "@/components/ui/ChartShell";
import type { ChartSummary } from "@/lib/api/types";
import { neon } from "@neondatabase/serverless";
import { PlotlyFigure } from "@/components/charts/legacy/PlotlyFigure";

export const runtime = "nodejs";

async function loadPlotlyChartFromDB(): Promise<ChartSummary | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[analyse] DATABASE_URL is not set");
    return null;
  }

  const sql = neon(databaseUrl);

  try {
    // Load Plotly JSON from the plots table
    // You can specify which plot to load, e.g., "polls" or another plot name
    const rows = await sql`
      SELECT name, plotly_json, last_update
      FROM plots
      WHERE name = 'polls'
      ORDER BY last_update DESC
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      console.info("[analyse] No Plotly chart found in plots table");
      return null;
    }

    const row = rows[0] as {
      name: string;
      plotly_json: unknown;
      last_update: string | null;
    };

    // Parse plotly_json
    const plotlyPayload =
      typeof row.plotly_json === "string"
        ? (JSON.parse(row.plotly_json) as unknown)
        : row.plotly_json;

    // Handle array-wrapped JSON
    const parsedPayload =
      Array.isArray(plotlyPayload) && typeof plotlyPayload[0] === "string"
        ? (JSON.parse(plotlyPayload[0]) as unknown)
        : plotlyPayload;

    const payloadObj =
      parsedPayload && typeof parsedPayload === "object"
        ? (parsedPayload as Record<string, unknown>)
        : null;

    if (!payloadObj) {
      console.error("[analyse] Invalid Plotly JSON structure");
      return null;
    }

    const plotlySpec = {
      version: "neon-db",
      data: Array.isArray(payloadObj.data) ? payloadObj.data : [],
      layout:
        payloadObj.layout && typeof payloadObj.layout === "object"
          ? (payloadObj.layout as Record<string, unknown>)
          : undefined,
      config:
        payloadObj.config && typeof payloadObj.config === "object"
          ? (payloadObj.config as Record<string, unknown>)
          : undefined,
    };

    console.info("[analyse] loaded Plotly chart from Neon", {
      name: row.name,
      lastUpdate: row.last_update,
      dataLength: plotlySpec.data.length,
    });

    return {
      id: `analyse:${row.name}`,
      title: `Analyse: ${row.name}`,
      description: "Plotly chart loaded from database for deep dive analysis",
      library: "plotly",
      updatedAt: row.last_update ?? new Date().toISOString(),
      dataSource: "Neon database (plots table)",
      unit: "",
      tags: ["analyse", "plotly", "kv25"],
      plotlySpec,
    };
  } catch (error) {
    console.error("[analyse] failed to load Plotly chart from Neon", {
      error,
    });
    return null;
  }
}

export default async function AnalyseKv25Page() {
  const plotlyChart = await loadPlotlyChartFromDB();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mt-8 space-y-8">
        {plotlyChart && plotlyChart.plotlySpec && (
          <ChartShell
            title={plotlyChart.title}
            description={plotlyChart.description}
            variant="bare"
          >
            <div className="w-full h-[600px]">
              <PlotlyFigure
                spec={plotlyChart.plotlySpec}
                ariaLabel={plotlyChart.title}
              />
            </div>
          </ChartShell>
        )}
        {!plotlyChart && (
          <div className="text-center text-slate-500">
            <p>Ingen Plotly chart fundet i databasen.</p>
            <p className="text-sm mt-2">
              Tjek at der er data i <code>plots</code> tabellen med <code>name = &apos;polls&apos;</code>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
