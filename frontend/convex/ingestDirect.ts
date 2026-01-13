import { httpAction } from "./_generated/server";
import Papa from "papaparse";
import { api } from "./_generated/api";
import { mapCsvToSchema } from "./schemaMapping";

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

    // Constant-time comparison using Web Crypto API to prevent timing attacks
    async function constantTimeEqual(a: string, b: string): Promise<boolean> {
      if (a.length !== b.length) {
        return false;
      }

      // Generate a random HMAC key for comparison
      const key = await crypto.subtle.generateKey(
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        true,
        ["sign"],
      );

      // Import the key for signing
      const encoder = new TextEncoder();
      const aData = encoder.encode(a);
      const bData = encoder.encode(b);

      // Compute HMACs
      const aHmac = await crypto.subtle.sign("HMAC", key, aData);
      const bHmac = await crypto.subtle.sign("HMAC", key, bData);

      // Constant-time byte-wise comparison
      const aArray = new Uint8Array(aHmac);
      const bArray = new Uint8Array(bHmac);

      let result = 0;
      for (let i = 0; i < aArray.length; i++) {
        result |= aArray[i] ^ bArray[i];
      }

      return result === 0;
    }

    const tokensMatch = await constantTimeEqual(
      secretToken || "",
      expectedToken,
    );
    if (!tokensMatch) {
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
