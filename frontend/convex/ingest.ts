import { httpAction } from "./_generated/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Papa from "papaparse";
import { api } from "./_generated/api";
import { mapCsvToSchema } from "./schemaMapping";

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

