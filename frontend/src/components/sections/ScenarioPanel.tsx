import { ScenarioInsight } from "@/lib/api/types";

type ScenarioPanelProps = {
  scenarios: ScenarioInsight[];
};

export function ScenarioPanel({ scenarios }: ScenarioPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Scenarier overvåget
        </h3>
        <p className="text-sm text-slate-500">
          Bruges som early warning, før vi implementerer fuld simulation i UI.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <article
            key={scenario.name}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">
                {scenario.name}
              </h4>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                {(scenario.probability * 100).toFixed(0)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{scenario.description}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
              Påvirker: {scenario.impactedParties.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

