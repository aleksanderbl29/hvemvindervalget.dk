import { InlineLink } from "@/components/ui/InlineLink";
import { WeightedPollsBarChart, type WeightedPollEntry } from "@/components/charts/WeightedPollsBarChart";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export const metadata = {
  title: "Folketingsvalget 2026 | Hvem vinder valget?",
};

async function loadWeightedPolls(): Promise<{ data: WeightedPollEntry[]; updatedAt: string | null; pollsters: string[] } | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[fv26] DATABASE_URL is not set");
    return null;
  }

  const sql = neon(databaseUrl);

  try {
    const [rows, pollsterRows, metaRows] = await Promise.all([
      sql`
        SELECT party_code, voteshare AS value, l_r_scale
        FROM weighted_poll
        WHERE segment = 'all'
        ORDER BY l_r_scale ASC NULLS LAST
      `,
      sql`SELECT name FROM pollsters ORDER BY name ASC`,
      sql`SELECT MAX(updated_at) AS updated_at FROM weighted_poll`,
    ]);

    if (!rows || rows.length === 0) {
      console.info("[fv26] No data found in weighted_poll table");
      return null;
    }

    console.info("[fv26] loaded weighted polls", { rowCount: rows.length });

    const data: WeightedPollEntry[] = rows.map((r) => ({
      party_code: String(r.party_code ?? ""),
      value: typeof r.value === "number" ? r.value : parseFloat(String(r.value ?? "0")),
      l_r_scale: r.l_r_scale !== null && r.l_r_scale !== undefined ? Number(r.l_r_scale) : null,
    }));

    const pollsters = pollsterRows.map((r) => String(r.name ?? "")).filter(Boolean);

    const updatedAt = metaRows[0]?.updated_at ? new Date(String(metaRows[0].updated_at)).toISOString() : null;

    return { data, updatedAt, pollsters };
  } catch (error) {
    console.error("[fv26] failed to load weighted polls", { error });
    return null;
  }
}

export default async function Folketingsvalget2026Page() {
  const result = await loadWeightedPolls();

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        Folketingsvalget 2026
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900">
        Vægtet gennemsnit af meningsmålingerne
      </h1>
      <p className="mt-4 text-base text-slate-600">
        Modellen kommer snart på denne side. Indtil da kan du se vægtet gennemsnit af meningsmålingerne.
        Læs mere om gennemsnittet og få en forsmag på modellens metode{" "}
        <InlineLink href="/om/metoder">her</InlineLink>.
      </p>

      <div className="mt-10">
        {result ? (
          <WeightedPollsBarChart data={result.data} updatedAt={result.updatedAt} pollsters={result.pollsters} />
        ) : (
          <p className="text-sm text-slate-500">Ingen data tilgængelig.</p>
        )}
      </div>
    </main>
  );
}
