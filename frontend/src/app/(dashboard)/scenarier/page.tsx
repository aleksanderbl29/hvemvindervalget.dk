"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ScenarioPanel } from "@/components/sections/ScenarioPanel";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function ScenariosPage() {
  const scenarios = useQuery(api.scenarios.get);

  if (scenarios === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Scenarier</h2>
          <p className="text-sm text-slate-500">
            Sammenligner følsomheder i modellen. Bruger for nu stub-data, men
            kobles op mod Monte-Carlo analysen så snart backend API'et er klar.
          </p>
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Scenarier</h2>
      <p className="text-sm text-slate-500">
        Sammenligner følsomheder i modellen. Bruger for nu stub-data, men
        kobles op mod Monte-Carlo analysen så snart backend API'et er klar.
      </p>
      <ScenarioPanel scenarios={scenarios} />
    </div>
  );
}
