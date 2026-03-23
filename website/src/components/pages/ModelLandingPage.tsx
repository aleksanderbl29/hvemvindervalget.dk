import { VoteShareBarChart } from "@/components/charts/VoteShareBarChart";
import { formatMessage } from "@/data/messages";
import { SeatHalfCircleDotPlot } from "@/components/charts/SeatHalfCircleDotPlot";
import type { ModelSummaryDatum } from "@/components/charts/ModelSummaryBarChart";
import { InlineLink } from "@/components/ui/InlineLink";
import { ChartShell } from "@/components/ui/ChartShell";
import { neon } from "@neondatabase/serverless";

type NumericLike = string | number | null;

type VoteForecastRow = {
  party_code: string | null;
  party_name: string | null;
  party_name_short: string | null;
  mean_vote_share: NumericLike;
  p10: NumericLike;
  p90: NumericLike;
};

type SeatForecastRow = {
  party_code: string | null;
  party_name: string | null;
  party_name_short: string | null;
  mean_seats: NumericLike;
  p10: NumericLike;
  p90: NumericLike;
};

type SectionStatus = "ok" | "empty" | "error";

type SectionResult = {
  status: SectionStatus;
  data: ModelSummaryDatum[];
};

type ModelPageData = {
  databaseConfigured: boolean;
  voteForecast: SectionResult;
  seatForecast: SectionResult;
};

type VoteScaleMode = "fraction" | "percent";

function parseNumber(value: NumericLike): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function summarizeRowShape(row: Record<string, unknown> | undefined) {
  if (!row) return null;

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value === null ? "null" : Array.isArray(value) ? "array" : typeof value,
    ]),
  );
}

function detectVoteScale(rows: VoteForecastRow[]): VoteScaleMode {
  const candidateValues = rows.flatMap((row) => [
    parseNumber(row.mean_vote_share),
    parseNumber(row.p10),
    parseNumber(row.p90),
  ]);

  const maxValue = candidateValues.reduce<number>((currentMax, value) => {
    if (value === null) return currentMax;
    return Math.max(currentMax, value);
  }, 0);

  return maxValue <= 1.5 ? "fraction" : "percent";
}

function normalizeVoteShare(value: number | null, scaleMode: VoteScaleMode): number | null {
  if (value === null) return null;
  return scaleMode === "fraction" ? value * 100 : value;
}

function normalizeVoteForecast(rows: VoteForecastRow[]): ModelSummaryDatum[] {
  const scaleMode = detectVoteScale(rows);

  console.info("[model] vote share scale detected", {
    scaleMode,
    sampleRaw: rows[0]
      ? {
          mean_vote_share: rows[0].mean_vote_share,
          p10: rows[0].p10,
          p90: rows[0].p90,
        }
      : null,
  });

  return rows
    .map((row) => {
      const partyCode = String(row.party_code ?? "").trim();
      const value = normalizeVoteShare(parseNumber(row.mean_vote_share), scaleMode);

      if (!partyCode || value === null) return null;

      return {
        partyCode,
        partyName: String(row.party_name_short ?? row.party_name ?? partyCode),
        value,
        lowerBound: normalizeVoteShare(parseNumber(row.p10), scaleMode),
        upperBound: normalizeVoteShare(parseNumber(row.p90), scaleMode),
      } satisfies ModelSummaryDatum;
    })
    .filter((row): row is ModelSummaryDatum => row !== null)
    .sort((a, b) => b.value - a.value);
}

function normalizeSeatForecast(rows: SeatForecastRow[]): ModelSummaryDatum[] {
  return rows
    .map((row) => {
      const partyCode = String(row.party_code ?? "").trim();
      const value = parseNumber(row.mean_seats);

      if (!partyCode || value === null) return null;

      return {
        partyCode,
        partyName: String(row.party_name_short ?? row.party_name ?? partyCode),
        value,
        lowerBound: parseNumber(row.p10),
        upperBound: parseNumber(row.p90),
      } satisfies ModelSummaryDatum;
    })
    .filter((row): row is ModelSummaryDatum => row !== null)
    .sort((a, b) => b.value - a.value);
}

async function loadVoteForecastSummary(databaseUrl: string): Promise<SectionResult> {
  try {
    const sql = neon(databaseUrl);
    const rows = (await sql`
      SELECT party_code, party_name, party_name_short, mean_vote_share, p10, p90
      FROM vote_forecast_summary
      ORDER BY mean_vote_share DESC
    `) as VoteForecastRow[];

    console.info("[model] loaded vote_forecast_summary", {
      rowCount: rows.length,
      sampleRowShape: summarizeRowShape(rows[0] as Record<string, unknown> | undefined),
    });

    if (rows.length === 0) {
      console.info("[model] vote_forecast_summary table is empty");
      return { status: "empty", data: [] };
    }

    const data = normalizeVoteForecast(rows);

    if (data.length === 0) {
      console.info("[model] vote_forecast_summary produced no usable rows after normalization");
      return { status: "empty", data: [] };
    }

    return { status: "ok", data };
  } catch (error) {
    console.error("[model] failed to load vote_forecast_summary", { error });
    return { status: "error", data: [] };
  }
}

async function loadSeatForecastSummary(databaseUrl: string): Promise<SectionResult> {
  try {
    const sql = neon(databaseUrl);
    const rows = (await sql`
      SELECT party_code, party_name, party_name_short, mean_seats, p10, p90
      FROM seat_summary
      ORDER BY mean_seats DESC
    `) as SeatForecastRow[];

    console.info("[model] loaded seat_summary", {
      rowCount: rows.length,
      sampleRowShape: summarizeRowShape(rows[0] as Record<string, unknown> | undefined),
    });

    if (rows.length === 0) {
      console.info("[model] seat_summary table is empty");
      return { status: "empty", data: [] };
    }

    const data = normalizeSeatForecast(rows);

    if (data.length === 0) {
      console.info("[model] seat_summary produced no usable rows after normalization");
      return { status: "empty", data: [] };
    }

    return { status: "ok", data };
  } catch (error) {
    console.error("[model] failed to load seat_summary", { error });
    return { status: "error", data: [] };
  }
}

async function loadModelPageData(): Promise<ModelPageData> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[model] DATABASE_URL is not set");

    return {
      databaseConfigured: false,
      voteForecast: { status: "error", data: [] },
      seatForecast: { status: "error", data: [] },
    };
  }

  const [voteForecast, seatForecast] = await Promise.all([
    loadVoteForecastSummary(databaseUrl),
    loadSeatForecastSummary(databaseUrl),
  ]);

  return {
    databaseConfigured: true,
    voteForecast,
    seatForecast,
  };
}

function renderSectionState(status: SectionStatus, emptyMessage: string) {
  if (status === "empty") {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  if (status === "error") {
    return (
      <p className="text-sm text-slate-500">
        Data kunne ikke hentes fra databasen. Tjek serverlogs for detaljer.
      </p>
    );
  }

  return null;
}

export async function ModelLandingPage() {
  const { databaseConfigured, voteForecast, seatForecast } = await loadModelPageData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-8">
        <section className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Model
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">
            Modellens prognose for folketingsvalget
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Her vises modellens forventede stemmeandel og mandatfordeling på baggrund af den seneste
            modelkørsel. Intervallerne viser spændet fra 10. til 90. percentil. Læs mere om modellen{" "}
            <InlineLink href="/om/metoder">her</InlineLink>.
          </p>
        </section>

        {!databaseConfigured ? (
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              {formatMessage("modelLanding.databaseNotConfigured")}
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <ChartShell
                title="Stemmeprognose"
                description="Modelens gennemsnitlige stemmeandel for hvert parti."
                variant="bare"
              >
                {voteForecast.status === "ok" ? (
                  <VoteShareBarChart data={voteForecast.data} />
                ) : (
                  renderSectionState(voteForecast.status, "Ingen stemmeprognose fundet i databasen.")
                )}
              </ChartShell>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <ChartShell
                title="Mandatprognose"
                description="Mandatfordelingen vist som en halvcirkel med ét punkt per mandat."
                variant="bare"
              >
                {seatForecast.status === "ok" ? (
                  <SeatHalfCircleDotPlot data={seatForecast.data} />
                ) : (
                  renderSectionState(seatForecast.status, "Ingen mandatprognose fundet i databasen.")
                )}
              </ChartShell>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
