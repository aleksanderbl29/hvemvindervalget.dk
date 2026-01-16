"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { NationalOverviewSection } from "@/components/sections/NationalOverview";
import { MunicipalityTable } from "@/components/sections/MunicipalityTable";
import { PollsSpotlight } from "@/components/sections/PollsSpotlight";
import { ScenarioPanel } from "@/components/sections/ScenarioPanel";
import { SkeletonCard, SkeletonTable, SkeletonStatCard } from "@/components/ui/Skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* National Overview Skeleton */}
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonCard />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonCard />
      </section>

      {/* Polls and Scenarios Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Municipality Table Skeleton */}
      <SkeletonTable />
    </div>
  );
}

export default function DashboardPage() {
  const nationalOverview = useQuery(api.nationalOverview.get);
  const polls = useQuery(api.polls.get);
  const municipalities = useQuery(api.municipalities.get);
  const scenarios = useQuery(api.scenarios.get);

  // Show loading skeleton while data is being fetched
  if (
    nationalOverview === undefined ||
    polls === undefined ||
    municipalities === undefined ||
    scenarios === undefined
  ) {
    return <DashboardSkeleton />;
  }

  // Handle case where critical data (nationalOverview) is missing
  if (!nationalOverview) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-slate-500">Ingen national oversigt tilgængelig</p>
          <p className="mt-1 text-sm text-slate-400">
            National oversigt data er påkrævet for at vise dashboardet
          </p>
        </div>
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

