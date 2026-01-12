import { httpAction } from "./_generated/server";
import Papa from "papaparse";
import { api } from "./_generated/api";
import { mapCsvToSchema } from "./utils/schemaMapper";
import { timingSafeEqual } from "crypto";

export const ingestDirect = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Authenticate using secret token from Authorization header
    const expectedToken = process.env.CONVEX_INGEST_SECRET_TOKEN;
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Extract token from Authorization header (format: "Convex <token>")
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authParts = authHeader.split(" ");
    if (authParts.length !== 2 || authParts[0] !== "Convex") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use timing-safe comparison for token
    const providedToken = authParts[1];
    const expectedBuffer = Buffer.from(expectedToken, "utf8");
    const providedBuffer = Buffer.from(providedToken, "utf8");

    // Ensure buffers are the same length for timing-safe comparison
    if (expectedBuffer.length !== providedBuffer.length) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      table,
      data,
    }: {
      table: string;
      data: string | Record<string, unknown>[];
    } = body;

    // Validate required fields
    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: table, data" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

