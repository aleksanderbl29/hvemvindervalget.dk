import { httpAction } from "./_generated/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import Papa from "papaparse";
import { api } from "./_generated/api";
import { mapCsvToSchema } from "./utils/schemaMapper";
import { timingSafeEqual } from "crypto";

export const ingest = httpAction(async (ctx, request) => {
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
      bucket,
      key,
      table,
      endpoint,
    }: {
      bucket: string;
      key: string;
      table: string;
      endpoint?: string;
    } = body;

    // Validate required fields
    if (!bucket || !key || !table) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bucket, key, table" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
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

    // Check object size first using HeadObject
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit
    const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const headResponse = await s3Client.send(headCommand);
    if (headResponse.ContentLength && headResponse.ContentLength > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch CSV from S3 with timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout

    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const s3Response = await s3Client.send(getObjectCommand, {
        abortSignal: abortController.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "S3 request timeout" }),
          { status: 408, headers: { "Content-Type": "application/json" } },
        );
      }
      throw error;
    }
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


