import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared chart schema definition
const chartSchema = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  library: v.optional(
    v.union(
      v.literal("plotly"),
      v.literal("echarts"),
      v.literal("chartjs"),
      v.literal("vega-lite"),
    ),
  ),
  updatedAt: v.string(),
  dataSource: v.string(),
  unit: v.string(),
  tags: v.array(v.string()),
  notes: v.optional(v.array(v.string())),
  plotlySpec: v.object({
    version: v.string(),
    data: v.array(v.any()),
    layout: v.optional(v.any()),
    config: v.optional(v.any()),
  }),
});

export default defineSchema({
  national_overview: defineTable({
    lastUpdated: v.string(),
    turnoutEstimate: v.number(),
    uncertainty: v.number(),
    partyProjections: v.array(
      v.object({
        party: v.string(),
        voteShare: v.number(),
        seatShare: v.number(),
        trend: v.number(),
      }),
    ),
    scenarioNotes: v.array(v.string()),
    primaryChart: v.optional(chartSchema),
  }),

  municipality_snapshots: defineTable({
    slug: v.string(),
    name: v.string(),
    region: v.string(),
    leadingParty: v.string(),
    voteShare: v.number(),
    turnout: v.number(),
  }).index("by_slug", ["slug"]),

  polls: defineTable({
    pollster: v.string(),
    conductedAt: v.string(),
    sampleSize: v.number(),
    methodology: v.string(),
    parties: v.array(
      v.object({
        party: v.string(),
        value: v.number(),
      }),
    ),
    chartSummary: v.optional(chartSchema),
  }).index("by_conducted_at", ["conductedAt"]),

  scenarios: defineTable({
    name: v.string(),
    description: v.string(),
    probability: v.number(),
    impactedParties: v.array(v.string()),
    chartSummary: v.optional(chartSchema),
  }).index("by_probability", ["probability"]),

  current_election_results: defineTable({
    afstemningsomrade: v.string(),
    bogstavbetegnelse: v.string(),
    listenavn: v.string(),
    navn: v.string(),
    stemmetal: v.number(),
    municipality: v.string(),
    last_pull: v.string(),
  })
    .index("by_municipality", ["municipality"])
    .index("by_last_pull", ["last_pull"]),
});
