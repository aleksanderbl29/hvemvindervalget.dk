import { notFound } from "next/navigation";
import { api } from "@/lib/api/client";
import { ChartShell } from "@/components/ui/ChartShell";
import { StatCard } from "@/components/ui/StatCard";

type MunicipalityPageParams = {
  slug: string;
};

type MunicipalityPageProps = {
  params: MunicipalityPageParams | Promise<MunicipalityPageParams>;
};

export default async function MunicipalityPage({ params }: MunicipalityPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
  const municipalities = await api.getMunicipalitySnapshots();
  const municipality = municipalities.find((item) => item.slug === slug);

  if (!municipality) {
    notFound();
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
        description="Her integrerer vi Plotly-linjer, når API’et eksponerer tidsserier."
      />
    </div>
  );
}

