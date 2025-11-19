import { NationalOverviewSection } from "@/components/sections/NationalOverview";
import { MunicipalityTable } from "@/components/sections/MunicipalityTable";
import { PollsSpotlight } from "@/components/sections/PollsSpotlight";
import { ScenarioPanel } from "@/components/sections/ScenarioPanel";
import { api } from "@/lib/api/client";

export default async function DashboardPage() {
  const [nationalOverview, polls, municipalities, scenarios] = await Promise.all(
    [
      api.getNationalOverview(),
      api.getPollHighlights(),
      api.getMunicipalitySnapshots(),
      api.getScenarioInsights(),
    ],
  );

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

