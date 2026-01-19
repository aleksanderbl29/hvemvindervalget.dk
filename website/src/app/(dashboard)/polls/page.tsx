import { PollsSpotlight } from "@/components/sections/PollsSpotlight";
import { api } from "@/lib/api/client";

export const metadata = {
  title: "Meningsmålinger | Hvem vinder valget?",
};

export default async function PollsPage() {
  const polls = await api.getPollHighlights();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">
        Meningsmålinger
      </h2>
      <p className="text-sm text-slate-500">
        Historik og seneste bevægelser. Her tilføjer vi snart interaktive
        tidsserier med Plotly.
      </p>
      <PollsSpotlight polls={polls} />
    </div>
  );
}

