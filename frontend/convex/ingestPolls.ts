import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import Papa from "papaparse";

/**
 * HTTP endpoint to ingest polls data from CSV
 * 
 * Usage:
 *   curl -X POST https://xxx.convex.site/ingestPolls \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $CONVEX_INGEST_SECRET_TOKEN" \
 *     -d '{"csvContent": "..."}'
 * 
 * Or with file:
 *   curl -X POST https://xxx.convex.site/ingestPolls \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer $CONVEX_INGEST_SECRET_TOKEN" \
 *     --data-binary @polls.csv
 */
export const ingestPolls = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
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

      const key = await crypto.subtle.generateKey(
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        true,
        ["sign"],
      );

      const encoder = new TextEncoder();
      const aData = encoder.encode(a);
      const bData = encoder.encode(b);

      const aHmac = await crypto.subtle.sign("HMAC", key, aData);
      const bHmac = await crypto.subtle.sign("HMAC", key, bData);

      const aArray = new Uint8Array(aHmac);
      const bArray = new Uint8Array(bHmac);

      let result = 0;
      for (let i = 0; i < aArray.length; i++) {
        result |= aArray[i] ^ bArray[i];
      }

      return result === 0;
    }

    // Get authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    const tokensMatch = await constantTimeEqual(token, expectedToken);
    if (!tokensMatch) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get CSV content from request
    let csvContent: string;
    const contentType = request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      // JSON body with csvContent field
      const body = await request.json();
      csvContent = body.csvContent || body.data || "";
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      // Direct CSV in body
      csvContent = await request.text();
    } else {
      // Try to parse as JSON first, fallback to text
      try {
        const body = await request.json();
        csvContent = body.csvContent || body.data || "";
      } catch {
        csvContent = await request.text();
      }
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No CSV content provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Call the seed action
    const result = await ctx.runAction(api.seedPolls.seedFromCsv, {
      csvContent,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Polls ingestion error:", error);
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
