"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PollsTable } from "@/components/sections/PollsTable";
import { SkeletonTable } from "@/components/ui/Skeleton";

export default function PollsPage() {
  const polls = useQuery(api.polls.get);

  if (polls === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Meningsmålinger
          </h2>
          <p className="text-sm text-slate-500">
            Historik og seneste bevægelser. Her tilføjer vi snart interaktive
            tidsserier med Plotly.
          </p>
        </div>
        <SkeletonTable />
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

