/**
 * Safe JSON parser that returns a fallback value on parse errors
 */
function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") {
    // If it's already the expected type, return it
    if (Array.isArray(value) && Array.isArray(fallback)) return value as T;
    if (typeof value === typeof fallback) return value as T;
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Maps CSV records to Convex schema format
 */
export function mapCsvToSchema(
  table: string,
  record: Record<string, unknown>,
): Record<string, unknown> | null {
  switch (table) {
    case "national_overview":
      return {
        lastUpdated: String(record.lastUpdated || record.last_updated || new Date().toISOString()),
        turnoutEstimate: Number(record.turnoutEstimate || record.turnout_estimate || 0),
        uncertainty: Number(record.uncertainty || 0),
        partyProjections: Array.isArray(record.partyProjections)
          ? record.partyProjections
          : safeJsonParse(record.partyProjections || record.party_projections, []),
        scenarioNotes: Array.isArray(record.scenarioNotes)
          ? record.scenarioNotes
          : safeJsonParse(record.scenarioNotes || record.scenario_notes, []),
        primaryChart: record.primaryChart
          ? safeJsonParse(record.primaryChart || record.primary_chart, undefined)
          : undefined,
      };

    case "municipality_snapshots":
      return {
        slug: String(record.slug || ""),
        name: String(record.name || ""),
        region: String(record.region || ""),
        leadingParty: String(record.leadingParty || record.leading_party || ""),
        voteShare: Number(record.voteShare || record.vote_share || 0),
        turnout: Number(record.turnout || 0),
      };

    case "polls":
      // Ensure conductedAt is a valid ISO-8601 string or use current timestamp
      const conductedAt = record.conductedAt || record.conducted_at;
      const validConductedAt = 
        conductedAt && String(conductedAt).trim() !== "" 
          ? String(conductedAt) 
          : new Date().toISOString();
      
      return {
        pollster: String(record.pollster || ""),
        conductedAt: validConductedAt,
        sampleSize: Number(record.sampleSize || record.sample_size || 0),
        methodology: String(record.methodology || ""),
        parties: Array.isArray(record.parties)
          ? record.parties
          : safeJsonParse(record.parties, []),
        chartSummary: record.chartSummary
          ? safeJsonParse(record.chartSummary || record.chart_summary, undefined)
          : undefined,
      };

    case "scenarios":
      return {
        name: String(record.name || ""),
        description: String(record.description || ""),
        probability: Number(record.probability || 0),
        impactedParties: Array.isArray(record.impactedParties)
          ? record.impactedParties
          : safeJsonParse(record.impactedParties || record.impacted_parties, []),
        chartSummary: record.chartSummary
          ? safeJsonParse(record.chartSummary || record.chart_summary, undefined)
          : undefined,
      };

    case "current_election_results":
      // Ensure lastPull is a valid ISO-8601 string or use current timestamp
      const lastPull = record.lastPull || record.last_pull;
      const validLastPull = 
        lastPull && String(lastPull).trim() !== "" 
          ? String(lastPull) 
          : new Date().toISOString();
      
      return {
        afstemningsomrade: String(record.afstemningsomrade || ""),
        bogstavbetegnelse: String(record.bogstavbetegnelse || ""),
        listenavn: String(record.listenavn || ""),
        navn: String(record.navn || ""),
        stemmetal: Number(record.stemmetal || 0),
        municipality: String(record.municipality || ""),
        lastPull: validLastPull,
      };

    default:
      return null;
  }
}
