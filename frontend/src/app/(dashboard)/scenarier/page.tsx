import { ScenarioPanel } from "@/components/sections/ScenarioPanel";
import { api } from "@/lib/api/client";

export const metadata = {
  title: "Scenarier | Hvem vinder valget?",
};

export default async function ScenariosPage() {
  const scenarios = await api.getScenarioInsights();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Scenarier</h2>
      <p className="text-sm text-slate-500">
        Sammenligner følsomheder i modellen. Bruger for nu stub-data, men
        kobles op mod Monte-Carlo analysen så snart backend API’et er klar.
      </p>
      <ScenarioPanel scenarios={scenarios} />
    </div>
  );
}

