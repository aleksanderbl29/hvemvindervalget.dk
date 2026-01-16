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
  parties: defineTable({
    letter: v.string(), // e.g., "A", "V", "M"
    name: v.string(), // e.g., "Socialdemokratiet"
    leaderName: v.string(),
    leaderImageUrl: v.string(),
    logoUrl: v.string(), // Party logo/image URL
    color: v.string(), // Hex color code
    order: v.number(), // Display order
  }).index("by_letter", ["letter"]),

  pollsters: defineTable({
    code: v.string(), // Short code/identifier, e.g., "epinion", "verian"
    name: v.string(), // Full display name, e.g., "Epinion"
    logoUrl: v.optional(v.string()), // Pollster logo/branding
    websiteUrl: v.optional(v.string()), // Website URL
    order: v.number(), // Display order
  }).index("by_code", ["code"]),

  regions: defineTable({
    code: v.string(), // Short code, e.g., "hovedstaden", "midtjylland"
    name: v.string(), // Full name, e.g., "Region Hovedstaden"
    shortName: v.string(), // Short display name, e.g., "Hovedstaden"
    order: v.number(), // Display order
  }).index("by_code", ["code"]),

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
    regionId: v.id("regions"), // Reference to regions table
    leadingParty: v.string(),
    voteShare: v.number(),
    turnout: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_region", ["regionId"]),

  polls: defineTable({
    pollsterId: v.id("pollsters"), // Reference to pollsters table
    conductedAt: v.string(),
    sampleSize: v.number(),
    methodology: v.string(), // Can be standardized later
    chartSummary: v.optional(chartSchema),
  })
    .index("by_conducted_at", ["conductedAt"])
    .index("by_pollster", ["pollsterId"]),

  poll_results: defineTable({
    pollId: v.id("polls"),
    party: v.string(), // Party letter
    value: v.number(), // Vote share percentage
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_party", ["pollId", "party"]),

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
