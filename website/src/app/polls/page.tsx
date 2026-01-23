export const metadata = {
  title: "Meningsmålinger | Hvem vinder valget?",
};

import { ChartShell } from "@/components/ui/ChartShell";
import type { ChartSummary } from "@/lib/api/types";
import { fetchLatestPlotlySpec } from "@/lib/api/plots";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

async function loadChartFromNeon(source: string): Promise<ChartSummary | null> {
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
    dataSource: source,
    unit: "",
    tags: ["polls", "neon"],
    plotlySpec,
  };
}

type PollsterStat = {
  name: string;
  nPolls: number;
  timerange: string;
};

type PollsterStatsResult = {
  pollsters: PollsterStat[];
};

async function loadPollsterStats(): Promise<PollsterStatsResult> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[polls] DATABASE_URL is not set when loading pollster stats");
    return { pollsters: [] };
  }

  const sql = neon(databaseUrl);

  try {
    const rows = await sql`
      SELECT name, n_polls, timerange
      FROM pollsters
      ORDER BY name ASC
    `;

    console.info("[polls] loaded pollster stats from Neon", {
      rowCount: rows.length ?? 0,
      sample: rows.slice(0, 3),
    });

    const pollsters: PollsterStat[] = rows
      .map((row) => {
        const r = row as {
          name: string | null;
          n_polls: number | null;
          timerange: string | null;
        };

        if (!r.name) return null;

        return {
          name: r.name,
          nPolls: r.n_polls ?? 0,
          timerange: r.timerange ?? "",
        };
      })
      .filter((p): p is PollsterStat => p !== null);

    return { pollsters };
  } catch (error) {
    console.error("[polls] failed to load pollster stats from Neon", { error });
    return { pollsters: [] };
  }
}

export default async function PollsPage() {
  const pollsters = await loadPollsterStats();

  const pollsterNames = (() => {
    const names = pollsters.pollsters.map((pollster) => pollster.name);
    if (names.length === 0) return "";
    return new Intl.ListFormat("da-DK", {
      style: "long",
      type: "conjunction",
    }).format(names);
  })();

  const chart = await loadChartFromNeon(pollsterNames);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* <h1 className="text-2xl font-semibold text-slate-900">Meningsmålinger</h1> */}
      {/* <p className="mt-2 text-sm text-slate-600">
        Oversigt over meningsmålinger gennem tiden. Her er inkluderet alle meningsmålinger foretaget af {pollsterNames}.
      </p> */}

      <div className="mt-8">
        <ChartShell
          title="Meningsmålinger siden 2020"
          description={"Hvem ville du stemme på, hvis der var valg i morgen?"}
          chart={chart ?? undefined}
          variant="bare"
        ></ChartShell>
      </div>
    </main>
  );
}

