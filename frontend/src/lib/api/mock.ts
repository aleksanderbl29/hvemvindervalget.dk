import nationalPartyShare from "@/data/mock-api/charts/national-party-share.json";
import {
  ChartSummary,
  MunicipalityWithRegion,
  NationalOverviewData,
  PollHighlight,
  ScenarioInsight,
} from "./types";

const parties = ["A", "V", "O", "B", "F", "Ø", "K", "Å"];

export function mockNationalOverview(): NationalOverviewData {
  const primaryChart = nationalPartyShare as ChartSummary;
  return {
    _id: "j0000000000000008" as any,
    _creationTime: Date.now(),
    lastUpdated: new Date().toISOString(),
    turnoutEstimate: 72.4,
    uncertainty: 1.1,
    partyProjections: parties.map((party, index) => ({
      party,
      voteShare: 26 - index * 2.8,
      seatShare: 48 - index * 3.5,
      trend: index % 2 === 0 ? 0.4 : -0.35,
    })),
    scenarioNotes: [
      "Baseline forecast includes postelection alliances observed in 2021.",
      "Turnout sensitivity ±2pp shifts majority balance for Copenhagen + Aarhus.",
    ],
    primaryChart,
  };
}

export function mockMunicipalitySnapshots(): MunicipalityWithRegion[] {
  return [
    {
      _id: "j0000000000000000" as any,
      _creationTime: Date.now(),
      slug: "koebenhavn",
      name: "København",
      regionId: "j0000000000000001" as any,
      region: "Hovedstaden",
      leadingParty: "A",
      voteShare: 27.5,
      turnout: 69.2,
    },
    {
      _id: "j0000000000000002" as any,
      _creationTime: Date.now(),
      slug: "aarhus",
      name: "Aarhus",
      regionId: "j0000000000000003" as any,
      region: "Midtjylland",
      leadingParty: "B",
      voteShare: 21.1,
      turnout: 71.8,
    },
    {
      _id: "j0000000000000004" as any,
      _creationTime: Date.now(),
      slug: "odense",
      name: "Odense",
      regionId: "j0000000000000005" as any,
      region: "Syddanmark",
      leadingParty: "F",
      voteShare: 18.9,
      turnout: 67.4,
    },
    {
      _id: "j0000000000000006" as any,
      _creationTime: Date.now(),
      slug: "aalborg",
      name: "Aalborg",
      regionId: "j0000000000000007" as any,
      region: "Nordjylland",
      leadingParty: "V",
      voteShare: 23.2,
      turnout: 70.1,
    },
  ];
}

export function mockPollHighlights(): PollHighlight[] {
  return [
    {
      _id: "j0000000000000009" as any,
      _creationTime: Date.now(),
      pollsterId: "j0000000000000010" as any,
      pollster: "Epinion",
      pollsterCode: "epinion",
      conductedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      sampleSize: 1478,
      methodology: "CATI + online panel",
      parties: parties.map((party, index) => ({
        party,
        value: 25 - index * 2.3,
      })),
    },
    {
      _id: "j0000000000000011" as any,
      _creationTime: Date.now(),
      pollsterId: "j0000000000000012" as any,
      pollster: "Voxmeter",
      pollsterCode: "voxmeter",
      conductedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      sampleSize: 1204,
      methodology: "RDD telephone",
      parties: parties.map((party, index) => ({
        party,
        value: 24.2 - index * 2.1,
      })),
    },
  ];
}

export function mockScenarioInsights(): ScenarioInsight[] {
  return [
    {
      _id: "j0000000000000013" as any,
      _creationTime: Date.now(),
      name: "Høj valgdelta i storbyerne",
      description:
        "Turnout shock (+4pp) concentrated in Copenhagen/Aarhus benefiting A/F alliances.",
      probability: 0.32,
      impactedParties: ["A", "F", "Ø"],
    },
    {
      _id: "j0000000000000014" as any,
      _creationTime: Date.now(),
      name: "Blå blok mobiliserer forstæderne",
      description:
        "Voters in commuting municipalities swing 2pp toward V/K which reshapes regional boards.",
      probability: 0.24,
      impactedParties: ["V", "K", "O"],
    },
  ];
}

