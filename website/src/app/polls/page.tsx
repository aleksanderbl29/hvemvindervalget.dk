import { ChartShell } from "@/components/ui/ChartShell";
import { PollsLineChart } from "@/components/charts/PollsLineChart";
import type { RechartsChartData } from "@/lib/api/types";
import { LAST_ELECTION_DATE } from "@/lib/config";
import { partyColor } from "@/data/parties";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

async function loadPollsData(): Promise<RechartsChartData | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[polls] DATABASE_URL is not set");
    return null;
  }

  const sql = neon(databaseUrl);

  try {
    const rows = await sql`
      SELECT *
      FROM polls
      WHERE segment = 'all'
        AND poll_date >= ${LAST_ELECTION_DATE}
      ORDER BY poll_date ASC
    `;

    if (!rows || rows.length === 0) {
      console.info("[polls] No data found in polls table");
      return null;
    }

    console.info("[polls] loaded polls data", { rowCount: rows.length });

    const parties = new Set<string>();
    const dateMap = new Map<string, Map<string, number>>();

    for (const row of rows) {
      const r = row as {
        party_code: string | null;
        party_name: string | null;
        poll_date: string | Date | null;
        value: number | null;
        segment: string | null;
      };

      if (!r.poll_date || !r.party_code || r.value === null || r.segment !== "all") continue;

      const dateStr =
        r.poll_date instanceof Date
          ? r.poll_date.toISOString().split("T")[0]
          : typeof r.poll_date === "string"
            ? r.poll_date.split("T")[0]
            : null;

      if (!dateStr) continue;

      if (!dateMap.has(dateStr)) dateMap.set(dateStr, new Map());
      dateMap.get(dateStr)!.set(r.party_code, r.value);
      parties.add(r.party_code);
    }

    const series = Array.from(parties)
      .sort()
      .map((code) => ({
        name: code,
        color: partyColor(code),
        data: Array.from(dateMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, partyMap]) => ({
            date,
            value: partyMap.get(code) ?? 0,
          })),
      }));

    return {
      type: "line",
      series,
      xAxisLabel: "Dato",
      yAxisLabel: "Stemmeandel (%)",
    };
  } catch (error) {
    console.error("[polls] failed to load polls data", { error });
    return null;
  }
}

export default async function PollsPage() {
  const lineData = await loadPollsData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mt-8">
        {lineData ? (
          <ChartShell
            title="Meningsmålinger siden sidste folketingsvalg"
            description="Hvem ville du stemme på, hvis der var valg i morgen?"
            variant="bare"
          >
            <PollsLineChart chartData={lineData} />
          </ChartShell>
        ) : (
          <p className="text-sm text-slate-500">Ingen måledata tilgængelig.</p>
        )}
      </div>
    </main>
  );
}
