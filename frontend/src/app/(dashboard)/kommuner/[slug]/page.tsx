"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import { ChartShell } from "@/components/ui/ChartShell";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton, SkeletonCard, SkeletonStatCard } from "@/components/ui/Skeleton";

function MunicipalityPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonCard />
    </div>
  );
}

export default function MunicipalityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const municipality = useQuery(api.municipalities.getBySlug, { slug });

  if (municipality === undefined) {
    return <MunicipalityPageSkeleton />;
  }

  if (!municipality) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-500">Kommune ikke fundet</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Kommune
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          {municipality.name}
        </h2>
        <p className="text-sm text-slate-500">{municipality.region}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Førende parti"
          value={municipality.leadingParty}
          helper="Estimat"
        />
        <StatCard
          label="Stemmemargin"
          value={`${municipality.voteShare.toFixed(1)}%`}
          helper="Aktuel modeludskrift"
        />
        <StatCard
          label="Valgdeltagelse"
          value={`${municipality.turnout.toFixed(1)}%`}
          helper="Seneste datapunkt"
        />
      </div>
      <ChartShell
        title="Udvikling over tid"
        description="Her integrerer vi Plotly-linjer, når API'et eksponerer tidsserier."
      />
    </div>
  );
}
