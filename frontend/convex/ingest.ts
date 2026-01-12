import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Papa from "papaparse";
import { api } from "./_generated/api";

export const ingest = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      bucket,
      key,
      table,
      endpoint,
      secretToken,
    }: {
      bucket: string;
      key: string;
      table: string;
      endpoint?: string;
      secretToken?: string;
    } = body;

    // Validate required fields
    if (!bucket || !key || !table) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bucket, key, table" }),
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

    // Get S3 credentials from environment
    const accessKeyId = process.env.SEVALA_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.SEVALA_S3_SECRET_ACCESS_KEY;
    const s3Endpoint = endpoint || process.env.SEVALA_S3_ENDPOINT;

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: "S3 credentials not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create S3 client for Sevala
    const s3Client = new S3Client({
      region: process.env.SEVALA_S3_REGION || "us-east-1",
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services like Sevala
    });

    // Fetch CSV from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const s3Response = await s3Client.send(getObjectCommand);
    if (!s3Response.Body) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch object from S3" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Read and parse CSV
    const csvText = await s3Response.Body.transformToString();
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const records = parseResult.data as Record<string, unknown>[];

    if (!Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data found in CSV" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Map CSV records to Convex schema and insert
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
    console.error("Ingestion error:", error);
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

// Helper function to map CSV records to Convex schema
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

