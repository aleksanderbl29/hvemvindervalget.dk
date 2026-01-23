import { neon } from "@neondatabase/serverless";
import type { ChartSummary } from "./types";

type PlotlySpecResult = {
  plotlySpec: ChartSummary["plotlySpec"];
  lastUpdate: string | null;
  name: string;
};

/**
 * Fetch the latest-updated Plotly spec for a given plot name from the `plots` table.
 * This normalises the JSON structure so it matches what Plotly.js expects.
 */
export async function fetchLatestPlotlySpec(
  plotName: string,
): Promise<PlotlySpecResult | null> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[plots] DATABASE_URL is not set");
    return null;
  }

  const sql = neon(databaseUrl);

  try {
    const rows = await sql`
      SELECT name, plotly_json, last_update
      FROM plots
      WHERE name = ${plotName}
      ORDER BY last_update DESC
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      console.error("[plots] No plots found in database for name", { plotName });
      return null;
    }

    const row = rows[0] as {
      name: string;
      plotly_json: unknown;
      last_update: string | null;
    };

    // plotly_json can be stored either as JSON text or already-parsed JSON.
    const plotlyPayload =
      typeof row.plotly_json === "string"
        ? (JSON.parse(row.plotly_json) as unknown)
        : row.plotly_json;

    // Some exports wrap the JSON in an array with a single JSON string element.
    const parsedPayload =
      Array.isArray(plotlyPayload) && typeof plotlyPayload[0] === "string"
        ? (JSON.parse(plotlyPayload[0]) as unknown)
        : plotlyPayload;

    const payloadObj =
      parsedPayload && typeof parsedPayload === "object"
        ? (parsedPayload as Record<string, unknown>)
        : null;

    const plotlySpec: ChartSummary["plotlySpec"] = {
      version: "neon-db",
      data: Array.isArray(payloadObj?.data) ? (payloadObj.data as unknown[]) : [],
      layout:
        payloadObj?.layout && typeof payloadObj.layout === "object"
          ? (payloadObj.layout as Record<string, unknown>)
          : undefined,
      config:
        payloadObj?.config && typeof payloadObj.config === "object"
          ? (payloadObj.config as Record<string, unknown>)
          : undefined,
    };

    if (process.env.NODE_ENV === "development") {
      const keys =
        payloadObj && typeof payloadObj === "object"
          ? Object.keys(payloadObj as Record<string, unknown>)
          : [];
      const traceCount = Array.isArray(plotlySpec.data) ? plotlySpec.data.length : 0;

      console.info("[plots] loaded Plotly spec from Neon", {
        name: row.name,
        lastUpdate: row.last_update,
        plotlyKeys: keys.slice(0, 12),
        traceCount,
      });
    }

    return {
      name: row.name,
      lastUpdate: row.last_update,
      plotlySpec,
    };
  } catch (error) {
    console.error("[plots] failed to load Plotly spec from Neon", {
      plotName,
      error,
    });
    return null;
  }
}

