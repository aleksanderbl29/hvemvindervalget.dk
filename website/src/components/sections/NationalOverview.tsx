import { NationalOverview } from "@/lib/api/types";
import { StatCard } from "../ui/StatCard";
import { ChartShell } from "../ui/ChartShell";

type NationalOverviewProps = {
  data: NationalOverview;
};

export function NationalOverviewSection({ data }: NationalOverviewProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Stemmeprognose"
          value={`${data.turnoutEstimate.toFixed(1)}%`}
          helper={`Seneste opdatering ${new Date(data.lastUpdated).toLocaleTimeString("da-DK")}`}
          trend={data.uncertainty * -1}
        />
        <StatCard
          label="Usikkerhed (95 %)"
          value={`±${data.uncertainty.toFixed(1)} pp`}
          helper="Monte-Carlo simulationsresultat"
        />
        <StatCard
          label="Scenarier overvåget"
          value={data.scenarioNotes.length}
          helper="Se detaljer under Scenarier"
        />
      </div>
      <ChartShell
        title="Partiernes fordeling"
        description="Kombineret estimat baseret på polls + kommunale fundamentals."
        chart={data.primaryChart}
      />
      <div className="grid grid-cols-2 gap-2 text-left text-slate-700 sm:grid-cols-4">
        {data.partyProjections.map((projection) => (
          <div key={projection.party} className="rounded-xl bg-white/60 p-3 shadow-inner">
            <p className="text-xs text-slate-500">{projection.party}</p>
            <p className="text-xl font-semibold">
              {projection.voteShare.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">
              Mandater: {projection.seatShare.toFixed(0)}
            </p>
            <p
              className={`text-xs ${
                projection.trend >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {projection.trend >= 0 ? "+" : ""}
              {projection.trend.toFixed(1)} pp uge/uge
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Modelnoter & scenarier
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          {data.scenarioNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

