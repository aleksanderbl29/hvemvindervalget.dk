export type ChartLibraryId = "plotly" | "echarts" | "chartjs" | "vega-lite";

export type PartyProjection = {
  party: string;
  voteShare: number;
  seatShare: number;
  trend: number;
};

export type NationalOverview = {
  lastUpdated: string;
  turnoutEstimate: number;
  uncertainty: number;
  partyProjections: PartyProjection[];
  scenarioNotes: string[];
  primaryChart?: ChartSummary;
};

export type MunicipalitySnapshot = {
  slug: string;
  name: string;
  region: string;
  leadingParty: string;
  voteShare: number;
  turnout: number;
};

export type PollsterName =
  | "Epinion"
  | "Verian"
  | (string & { _?: never });

export type ChartSummary = {
  id: string;
  title: string;
  description: string;
  library?: ChartLibraryId;
  updatedAt: string;
  dataSource: string;
  unit: string;
  tags: string[];
  notes?: string[];
  plotlySpec: {
    version: string;
    data: unknown[];
    layout?: Record<string, unknown>;
    config?: Record<string, unknown>;
  };
};

export type PollHighlight = {
  pollster: PollsterName;
  conductedAt: string;
  sampleSize: number;
  methodology: string;
  parties: Array<{ party: string; value: number }>;
  chartSummary?: ChartSummary;
};

export type ScenarioInsight = {
  name: string;
  description: string;
  probability: number;
  impactedParties: string[];
  chartSummary?: ChartSummary;
};

