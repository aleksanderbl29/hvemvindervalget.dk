import type { Doc, Id } from "@convex/_generated/dataModel";

// Re-export Convex-generated table document types
export type Party = Doc<"parties">;
export type Pollster = Doc<"pollsters">;
export type Region = Doc<"regions">;
export type Poll = Doc<"polls">;
export type PollResult = Doc<"poll_results">;
export type MunicipalitySnapshot = Doc<"municipality_snapshots">;
export type Scenario = Doc<"scenarios">;
export type NationalOverview = Doc<"national_overview">;

export type ChartLibraryId = "plotly" | "echarts" | "chartjs" | "vega-lite";

// Nested types that are part of documents but need separate type definitions
export type PartyProjection = {
  party: string;
  voteShare: number;
  seatShare: number;
  trend: number;
};

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

// Query return types - manually defined based on query handlers
export type PollHighlight = {
  _id: Id<"polls">;
  _creationTime: number;
  pollsterId: Id<"pollsters">;
  conductedAt: string;
  sampleSize: number;
  methodology: string;
  chartSummary?: ChartSummary;
  pollster: string;
  pollsterCode: string | null;
  parties: Array<{ party: string; value: number }>;
};

export type PollsQueryResult = PollHighlight[];

export type MunicipalityWithRegion = MunicipalitySnapshot & {
  region: string;
};

export type MunicipalitiesQueryResult = MunicipalityWithRegion[];

export type ScenarioInsight = Scenario;

export type ScenariosQueryResult = ScenarioInsight[];

export type NationalOverviewData = NationalOverview;

export type NationalOverviewQueryResult = NationalOverview | null;

