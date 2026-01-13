// Helper function to safely parse JSON with fallback
function safeJsonParse<T>(
  value: unknown,
  fallback: T,
  fieldName?: string,
): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return fallback;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      const fieldInfo = fieldName ? ` for field '${fieldName}'` : "";
      console.warn(
        `Failed to parse JSON${fieldInfo}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return fallback;
    }
  }

  // If already the expected type, return as-is
  if (Array.isArray(value) && Array.isArray(fallback)) {
    return value as T;
  }

  return fallback;
}

// Helper function to map CSV records to Convex schema
export function mapCsvToSchema(
  table: string,
  record: Record<string, unknown>,
): Record<string, unknown> | null {
  switch (table) {
    case "national_overview":
      return {
        lastUpdated: String(
          record.lastUpdated || record.last_updated || new Date().toISOString(),
        ),
        turnoutEstimate: Number(
          record.turnoutEstimate || record.turnout_estimate || 0,
        ),
        uncertainty: Number(record.uncertainty || 0),
        partyProjections: safeJsonParse(
          record.partyProjections || record.party_projections,
          [],
          "partyProjections",
        ),
        scenarioNotes: safeJsonParse(
          record.scenarioNotes || record.scenario_notes,
          [],
          "scenarioNotes",
        ),
        primaryChart: record.primaryChart || record.primary_chart
          ? safeJsonParse(
              record.primaryChart || record.primary_chart,
              undefined,
              "primaryChart",
            )
          : undefined,
      };

    case "municipality_snapshots":
      return {
        slug: String(record.slug || ""),
        name: String(record.name || ""),
        region: String(record.region || ""),
        leadingParty: String(
          record.leadingParty || record.leading_party || "",
        ),
        voteShare: Number(record.voteShare || record.vote_share || 0),
        turnout: Number(record.turnout || 0),
      };

    case "polls":
      return {
        pollster: String(record.pollster || ""),
        conductedAt: String(record.conductedAt || record.conducted_at || ""),
        sampleSize: Number(record.sampleSize || record.sample_size || 0),
        methodology: String(record.methodology || ""),
        parties: safeJsonParse(record.parties, [], "parties"),
        chartSummary: record.chartSummary || record.chart_summary
          ? safeJsonParse(
              record.chartSummary || record.chart_summary,
              undefined,
              "chartSummary",
            )
          : undefined,
      };

    case "scenarios":
      return {
        name: String(record.name || ""),
        description: String(record.description || ""),
        probability: Number(record.probability || 0),
        impactedParties: safeJsonParse(
          record.impactedParties || record.impacted_parties,
          [],
          "impactedParties",
        ),
        chartSummary: record.chartSummary || record.chart_summary
          ? safeJsonParse(
              record.chartSummary || record.chart_summary,
              undefined,
              "chartSummary",
            )
          : undefined,
      };

    case "current_election_results":
      return {
        afstemningsomrade: String(record.afstemningsomrade || ""),
        bogstavbetegnelse: String(record.bogstavbetegnelse || ""),
        listenavn: String(record.listenavn || ""),
        navn: String(record.navn || ""),
        stemmetal: Number(record.stemmetal || 0),
        municipality: String(record.municipality || ""),
        last_pull: String(record.last_pull || ""),
      };

    default:
      return null;
  }
}
