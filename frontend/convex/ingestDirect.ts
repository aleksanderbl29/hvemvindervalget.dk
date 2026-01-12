import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import Papa from "papaparse";
import { api } from "./_generated/api";

export const ingestDirect = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      table,
      data,
      secretToken,
    }: {
      table: string;
      data: string | Record<string, unknown>[];
      secretToken?: string;
    } = body;

    // Validate required fields
    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: table, data" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Authenticate using secret token
    const expectedToken = process.env.CONVEX_INGEST_SECRET_TOKEN;
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (secretToken !== expectedToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse data - can be CSV string or JSON array
    let records: Record<string, unknown>[];

    if (typeof data === "string") {
      // Parse CSV string
      const parseResult = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      records = parseResult.data as Record<string, unknown>[];
    } else if (Array.isArray(data)) {
      // Already an array of objects
      records = data;
    } else {
      return new Response(
        JSON.stringify({ error: "Data must be a CSV string or array of objects" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data found" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Map records to Convex schema and insert
    let insertedCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        const mappedRecord = mapCsvToSchema(table, record);
        if (mappedRecord) {
          await ctx.runMutation(api.ingestMutations.insertRecord, {
            table,
            data: mappedRecord,
          });
          insertedCount++;
        }
      } catch (error) {
        errors.push(
          `Failed to insert record: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedCount,
        total: records.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Direct ingestion error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

// Helper function to map records to Convex schema
function mapCsvToSchema(
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
          : JSON.parse(String(record.partyProjections || record.party_projections || "[]")),
        scenarioNotes: Array.isArray(record.scenarioNotes)
          ? record.scenarioNotes
          : JSON.parse(String(record.scenarioNotes || record.scenario_notes || "[]")),
        primaryChart: record.primaryChart
          ? JSON.parse(String(record.primaryChart || record.primary_chart))
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
      return {
        pollster: String(record.pollster || ""),
        conductedAt: String(record.conductedAt || record.conducted_at || ""),
        sampleSize: Number(record.sampleSize || record.sample_size || 0),
        methodology: String(record.methodology || ""),
        parties: Array.isArray(record.parties)
          ? record.parties
          : JSON.parse(String(record.parties || "[]")),
        chartSummary: record.chartSummary
          ? JSON.parse(String(record.chartSummary || record.chart_summary))
          : undefined,
      };

    case "scenarios":
      return {
        name: String(record.name || ""),
        description: String(record.description || ""),
        probability: Number(record.probability || 0),
        impactedParties: Array.isArray(record.impactedParties)
          ? record.impactedParties
          : JSON.parse(String(record.impactedParties || record.impacted_parties || "[]")),
        chartSummary: record.chartSummary
          ? JSON.parse(String(record.chartSummary || record.chart_summary))
          : undefined,
      };

    default:
      return null;
  }
}
