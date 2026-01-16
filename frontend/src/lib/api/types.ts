import type { Doc } from "@convex/_generated/dataModel";
import type { QueryResult } from "convex/react";
import type { api } from "@convex/_generated/api";

// Re-export Convex-generated table document types
export type Party = Doc<"parties">;
export type Pollster = Doc<"pollsters">;
export type Region = Doc<"regions">;
export type Poll = Doc<"polls">;
export type PollResult = Doc<"poll_results">;
export type MunicipalitySnapshot = Doc<"municipality_snapshots">;
export type Scenario = Doc<"scenarios">;
export type NationalOverview = Doc<"national_overview">;

// Query return types - inferred from Convex queries
export type PollsQueryResult = QueryResult<typeof api.polls.get>;
export type PollHighlight = NonNullable<PollsQueryResult>[number];

export type MunicipalitiesQueryResult = QueryResult<typeof api.municipalities.get>;
export type MunicipalityWithRegion = NonNullable<MunicipalitiesQueryResult>[number];

export type ScenariosQueryResult = QueryResult<typeof api.scenarios.get>;
export type ScenarioInsight = NonNullable<ScenariosQueryResult>[number];

export type NationalOverviewQueryResult = QueryResult<typeof api.nationalOverview.get>;
export type NationalOverviewData = NonNullable<NationalOverviewQueryResult>;

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

