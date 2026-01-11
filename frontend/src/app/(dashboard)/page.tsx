"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { NationalOverviewSection } from "@/components/sections/NationalOverview";
import { MunicipalityTable } from "@/components/sections/MunicipalityTable";
import { PollsSpotlight } from "@/components/sections/PollsSpotlight";
import { ScenarioPanel } from "@/components/sections/ScenarioPanel";

export default function DashboardPage() {
  const nationalOverview = useQuery(api.nationalOverview.get);
  const polls = useQuery(api.polls.get);
  const municipalities = useQuery(api.municipalities.get);
  const scenarios = useQuery(api.scenarios.get);

  // Show loading state while data is being fetched
  if (
    nationalOverview === undefined ||
    polls === undefined ||
    municipalities === undefined ||
    scenarios === undefined
  ) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Indlæser data...</div>
      </div>
    );
  }

  // Handle case where data might be null
  if (!nationalOverview || !polls || !municipalities || !scenarios) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Ingen data tilgængelig</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NationalOverviewSection data={nationalOverview} />
      <div className="grid gap-6 lg:grid-cols-2">
        <PollsSpotlight polls={polls} />
        <ScenarioPanel scenarios={scenarios} />
      </div>
      <MunicipalityTable municipalities={municipalities} />
    </div>
  );
}

