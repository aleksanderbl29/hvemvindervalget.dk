#!/usr/bin/env tsx

/**
 * Wrapper script that reads polls.csv and calls the Convex seedPolls action
 * 
 * This combines file reading (which works in Node.js) with the Convex action
 * (which handles the database operations).
 * 
 * Usage:
 *   npx tsx scripts/seed-polls-wrapper.ts
 */

import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import * as path from "path";
import { api } from "../convex/_generated/api";

async function main() {
  // Get Convex URL from environment (set by `npx convex dev`)
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL not set");
    console.error("Make sure you're running this after `npx convex dev` or set CONVEX_URL");
    process.exit(1);
  }

  // Read CSV file
  const csvPath = path.join(process.cwd(), "polls.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: polls.csv not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading polls.csv from ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Initialize Convex client (no auth needed for actions in dev)
  const client = new ConvexHttpClient(convexUrl);

  console.log("Calling Convex seedPolls:seedFromCsv action...");
  const result = await client.action(api.seedPolls.seedFromCsv, {
    csvContent,
  });

  console.log("\nImport complete!");
  console.log(`  Successfully imported: ${result.imported} polls`);
  if (result.errors > 0) {
    console.log(`  Errors: ${result.errors} polls`);
  }
  console.log(`  Total: ${result.total} polls`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
