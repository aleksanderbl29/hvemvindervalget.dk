import { ChartShell } from "@/components/ui/ChartShell";
import type { RechartsChartData } from "@/lib/api/types";
import { neon } from "@neondatabase/serverless";
import { RechartsFigureServer } from "@/components/charts/RechartsFigureServer";

export const runtime = "nodejs";


async function loadRechartsPollsData(): Promise<{
  lineData: RechartsChartData;
  areaData: RechartsChartData;
} | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[polls] DATABASE_URL is not set when loading Recharts polls data");
    return null;
  }

  const sql = neon(databaseUrl);

  try {
    // Load data from polls table
    // Filter to only include segment = 'all'
    const rows = await sql`
      SELECT *
      FROM polls
      WHERE segment = 'all'
        AND poll_date >= '2018-01-01'
      ORDER BY poll_date ASC
    `;

    if (!rows || rows.length === 0) {
      console.info("[polls] No data found in polls table");
      return null;
    }

    console.info("[polls] loaded polls data from Neon", {
      rowCount: rows.length ?? 0,
      sample: rows[0],
    });

    // Table structure: party_code, party_name, poll_date, value, segment, pollster, n, election
    const parties = new Set<string>();
    const dateMap = new Map<string, Map<string, number>>();

    rows.forEach((row) => {
      const r = row as {
        party_code: string | null;
        party_name: string | null;
        poll_date: string | Date | null;
        value: number | null;
        segment: string | null;
        pollster: string | null;
        n: number | null;
        election: string | Date | null;
      };

      if (!r.poll_date || !r.party_code || r.value === null || r.segment !== "all") return;

      const dateStr =
        r.poll_date instanceof Date
          ? r.poll_date.toISOString().split("T")[0]
          : typeof r.poll_date === "string"
            ? r.poll_date.split("T")[0]
            : null;

      if (!dateStr) return;

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, new Map());
      }
      dateMap.get(dateStr)!.set(r.party_code, r.value);
      parties.add(r.party_code);
    });

    // Normalize data so each date sums to 100%
    const normalizedDateMap = new Map<string, Map<string, number>>();
    dateMap.forEach((partyMap, date) => {
      const total = Array.from(partyMap.values()).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        const normalized = new Map<string, number>();
        partyMap.forEach((value, party) => {
          normalized.set(party, (value / total) * 100);
        });
        normalizedDateMap.set(date, normalized);
      }
    });

    // Create series for each party (non-normalized for line chart)
    const lineSeries = Array.from(parties)
      .sort()
      .map((party) => {
        const data = Array.from(dateMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, partyMap]) => ({
            date,
            value: partyMap.get(party) ?? 0,
          }));

        return {
          name: party,
          data,
        };
      });

    // Create series for each party with normalized data (for stacked area chart)
    const areaSeries = Array.from(parties)
      .sort()
      .map((party) => {
        const data = Array.from(normalizedDateMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, partyMap]) => ({
            date,
            value: partyMap.get(party) ?? 0,
          }));

        return {
          name: party,
          data,
        };
      });

    return {
      lineData: {
        type: "line",
        series: lineSeries,
        xAxisLabel: "Dato",
        yAxisLabel: "Stemmeandel (%)",
      },
      areaData: {
        type: "area",
        series: areaSeries,
        xAxisLabel: "Dato",
        yAxisLabel: "Stemmeandel (%)",
      },
    };
  } catch (error) {
    console.error("[polls] failed to load Recharts polls data from Neon", {
      error,
    });
    return null;
  }
}

export default async function PollsPage() {
  const chartsData = await loadRechartsPollsData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mt-8 space-y-8">
        {chartsData && (
          <>
            <ChartShell
              title="Meningsmålinger siden 2020"
              description={"Hvem ville du stemme på, hvis der var valg i morgen?"}
              variant="bare"
            >
              <div className="w-full">
                <RechartsFigureServer
                  chartData={chartsData.lineData}
                  ariaLabel="Meningsmålinger siden 2020"
                  height="35vh"
                />
              </div>
            </ChartShell>

            <ChartShell
              title="Stemmeandele over tid"
              description={"Kumuleret visning af partiernes stemmeandele - normaliseret til 100%"}
              variant="bare"
            >
              <div className="w-full">
                <RechartsFigureServer
                  chartData={chartsData.areaData}
                  ariaLabel="Stemmeandele over tid"
                  height="30vh"
                />
              </div>
            </ChartShell>
          </>
        )}
      </div>
    </main>
  );
}

