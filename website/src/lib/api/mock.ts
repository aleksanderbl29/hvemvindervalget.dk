import nationalPartyShare from "@/data/mock-api/charts/national-party-share.json";
import {
  ChartSummary,
  MunicipalitySnapshot,
  NationalOverview,
  PollHighlight,
  ScenarioInsight,
} from "./types";

const parties = ["A", "V", "O", "B", "F", "Ø", "K", "Å"];

export function mockNationalOverview(): NationalOverview {
  const primaryChart = nationalPartyShare as ChartSummary;
  return {
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

export function mockMunicipalitySnapshots(): MunicipalitySnapshot[] {
  return [
    {
      slug: "koebenhavn",
      name: "København",
      region: "Hovedstaden",
      leadingParty: "A",
      voteShare: 27.5,
      turnout: 69.2,
    },
    {
      slug: "aarhus",
      name: "Aarhus",
      region: "Midtjylland",
      leadingParty: "B",
      voteShare: 21.1,
      turnout: 71.8,
    },
    {
      slug: "odense",
      name: "Odense",
      region: "Syddanmark",
      leadingParty: "F",
      voteShare: 18.9,
      turnout: 67.4,
    },
    {
      slug: "aalborg",
      name: "Aalborg",
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
      pollster: "Epinion",
      conductedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      sampleSize: 1478,
      methodology: "CATI + online panel",
      parties: parties.map((party, index) => ({
        party,
        value: 25 - index * 2.3,
      })),
    },
    {
      pollster: "Voxmeter",
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
      name: "Høj valgdelta i storbyerne",
      description:
        "Turnout shock (+4pp) concentrated in Copenhagen/Aarhus benefiting A/F alliances.",
      probability: 0.32,
      impactedParties: ["A", "F", "Ø"],
    },
    {
      name: "Blå blok mobiliserer forstæderne",
      description:
        "Voters in commuting municipalities swing 2pp toward V/K which reshapes regional boards.",
      probability: 0.24,
      impactedParties: ["V", "K", "O"],
    },
  ];
}

