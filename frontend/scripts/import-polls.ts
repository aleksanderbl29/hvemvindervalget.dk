#!/usr/bin/env tsx

/**
 * Script to import polls from polls.csv into Convex database
 * 
 * Usage:
 *   npx tsx scripts/import-polls.ts
 * 
 * Make sure CONVEX_URL and CONVEX_DEPLOY_KEY are set in your environment,
 * or the script will use the default Convex dev environment.
 */

import { ConvexHttpClient } from "convex/browser";
import Papa from "papaparse";
import * as fs from "fs";
import * as path from "path";
import { api } from "../convex/_generated/api";

interface PollRow {
  party_code: string;
  party_name: string;
  poll_date: string;
  value: number;
  segment: string;
  pollster: string;
  n: number;
  election: string;
  days_out: string;
}

interface PollGroup {
  pollDate: string;
  pollster: string;
  sampleSize: number;
  rows: PollRow[];
}

async function main() {
  // Get Convex URL and deploy key from environment
  const convexUrl = process.env.CONVEX_URL;
  const deployKey = process.env.CONVEX_DEPLOY_KEY;

  if (!convexUrl) {
    console.error("Error: CONVEX_URL environment variable is not set");
    console.error("Set it to your Convex deployment URL (e.g., https://xxx.convex.cloud)");
    process.exit(1);
  }

  if (!deployKey) {
    console.warn("Warning: CONVEX_DEPLOY_KEY not set. Using anonymous access.");
    console.warn("For production/preview, set CONVEX_DEPLOY_KEY in your environment.");
  }

  // Initialize Convex client
  const client = new ConvexHttpClient(convexUrl);
  if (deployKey) {
    client.setAuth(deployKey);
  }

  // Read CSV file
  const csvPath = path.join(process.cwd(), "polls.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: polls.csv not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading polls.csv from ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV
  console.log("Parsing CSV...");
  const parseResult = Papa.parse<PollRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (parseResult.errors.length > 0) {
    console.warn("CSV parsing warnings:");
    parseResult.errors.forEach((error) => {
      console.warn(`  Row ${error.row}: ${error.message}`);
    });
  }

  const rows = parseResult.data;
  console.log(`Found ${rows.length} rows in CSV`);

  // Filter to only "all" segment rows (we'll use these for the main poll results)
  const allSegmentRows = rows.filter((row) => row.segment === "all");
  console.log(`Found ${allSegmentRows.length} rows with segment="all"`);

  // Group rows by poll_date, pollster, and n (sample size) to identify unique polls
  const pollGroups = new Map<string, PollGroup>();

  for (const row of allSegmentRows) {
    const key = `${row.poll_date}|${row.pollster}|${row.n}`;
    
    if (!pollGroups.has(key)) {
      pollGroups.set(key, {
        pollDate: row.poll_date,
        pollster: row.pollster,
        sampleSize: row.n,
        rows: [],
      });
    }
    
    pollGroups.get(key)!.rows.push(row);
  }

  console.log(`\nFound ${pollGroups.size} unique polls to import`);

  // Import polls
  let imported = 0;
  let errors = 0;
  const pollsterCache = new Map<string, string>(); // pollster name -> pollster ID

  for (const [key, group] of pollGroups) {
    try {
      // Get or create pollster
      let pollsterId = pollsterCache.get(group.pollster);
      if (!pollsterId) {
        console.log(`  Getting/creating pollster: ${group.pollster}`);
        pollsterId = await client.mutation(api.ingestMutations.getOrCreatePollster, {
          name: group.pollster,
          code: group.pollster.toLowerCase().replace(/\s+/g, "-"),
        });
        pollsterCache.set(group.pollster, pollsterId);
      }

      // Prepare poll results (only for segment="all")
      const results = group.rows.map((row) => ({
        party: row.party_code,
        value: row.value,
      }));

      // Create poll with results
      console.log(
        `  Importing poll: ${group.pollDate} by ${group.pollster} (n=${group.sampleSize}, ${results.length} parties)`
      );
      
      await client.mutation(api.ingestMutations.createPollWithResults, {
        pollsterId,
        conductedAt: group.pollDate,
        sampleSize: group.sampleSize,
        methodology: "Unknown", // CSV doesn't have methodology field
        results,
      });

      imported++;
    } catch (error) {
      console.error(`  Error importing poll ${key}:`, error);
      errors++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`  Successfully imported: ${imported} polls`);
  if (errors > 0) {
    console.log(`  Errors: ${errors} polls`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
