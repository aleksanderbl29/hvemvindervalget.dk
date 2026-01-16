"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PollsTable } from "@/components/sections/PollsTable";

export default function PollsPage() {
  const polls = useQuery(api.polls.get);

  if (polls === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Indlæser data...</div>
      </div>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Meningsmålinger
        </h2>
        <p className="text-sm text-slate-500">
          Historik og seneste bevægelser. Her tilføjer vi snart interaktive
          tidsserier med Plotly.
        </p>
        <div className="flex items-center justify-center p-8">
          <div className="text-slate-500">Ingen data tilgængelig</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Meningsmålinger
        </h2>
        <p className="text-sm text-slate-500">
          Oversigt over alle polls med partier som kolonner. Hver række
          repræsenterer en poll, og hver kolonne viser et partis resultat.
        </p>
      </div>
      <PollsTable polls={polls} />
    </div>
  );
}

