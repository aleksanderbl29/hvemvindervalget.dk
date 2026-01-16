#!/usr/bin/env tsx

/**
 * Pre-process polls.csv into separate JSON files for Convex CLI import
 * 
 * This script transforms the CSV into separate JSON files:
 * - pollsters.json: Unique pollsters
 * - polls.json: Poll records
 * - poll_results.json: Poll result records
 * 
 * Usage:
 *   npx tsx scripts/prepare-polls-import.ts
 *   npx convex import --table pollsters pollsters.json
 *   npx convex import --table polls polls.json
 *   npx convex import --table poll_results poll_results.json
 * 
 * Note: This approach requires manual handling of relationships (pollsterId references)
 * and is less ideal than using the seedPolls action.
 */

import Papa from "papaparse";
import * as fs from "fs";
import * as path from "path";

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

async function main() {
  const csvPath = path.join(process.cwd(), "polls.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: polls.csv not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading polls.csv from ${csvPath}...`);
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV
  const parseResult = Papa.parse<PollRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const rows = parseResult.data;
  const allSegmentRows = rows.filter((row) => row.segment === "all");

  // Extract unique pollsters
  const pollsterMap = new Map<string, { code: string; name: string; order: number }>();
  let pollsterOrder = 0;

  for (const row of allSegmentRows) {
    if (!pollsterMap.has(row.pollster)) {
      pollsterMap.set(row.pollster, {
        code: row.pollster.toLowerCase().replace(/\s+/g, "-"),
        name: row.pollster,
        order: pollsterOrder++,
      });
    }
  }

  // Group polls
  const pollGroups = new Map<
    string,
    { pollDate: string; pollster: string; sampleSize: number; rows: PollRow[] }
  >();

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

  // Generate pollsters.json
  const pollsters = Array.from(pollsterMap.values());
  fs.writeFileSync(
    path.join(process.cwd(), "pollsters.json"),
    JSON.stringify(pollsters, null, 2)
  );
  console.log(`Created pollsters.json with ${pollsters.length} pollsters`);

  // Generate polls.json (note: pollsterId will need to be set manually or via script)
  const polls = Array.from(pollGroups.values()).map((group, index) => ({
    // pollsterId will need to be resolved after pollsters are imported
    // For now, we'll use a placeholder that needs manual fixing
    pollsterName: group.pollster, // Temporary field
    conductedAt: group.pollDate,
    sampleSize: group.sampleSize,
    methodology: "Unknown",
  }));

  fs.writeFileSync(
    path.join(process.cwd(), "polls.json"),
    JSON.stringify(polls, null, 2)
  );
  console.log(`Created polls.json with ${polls.length} polls`);
  console.warn(
    "⚠️  Note: polls.json contains pollsterName instead of pollsterId."
  );
  console.warn(
    "    You'll need to update pollsterId references after importing pollsters."
  );

  // Generate poll_results.json (note: pollId will need to be set manually)
  const pollResults: Array<{ pollIndex: number; party: string; value: number }> =
    [];
  let pollIndex = 0;

  for (const group of pollGroups.values()) {
    for (const row of group.rows) {
      pollResults.push({
        pollIndex, // Temporary field - needs to be replaced with actual pollId
        party: row.party_code,
        value: row.value,
      });
    }
    pollIndex++;
  }

  fs.writeFileSync(
    path.join(process.cwd(), "poll_results.json"),
    JSON.stringify(pollResults, null, 2)
  );
  console.log(`Created poll_results.json with ${pollResults.length} results`);
  console.warn(
    "⚠️  Note: poll_results.json contains pollIndex instead of pollId."
  );
  console.warn(
    "    You'll need to update pollId references after importing polls."
  );

  console.log("\n⚠️  WARNING: This approach requires manual ID resolution.");
  console.log("    Consider using the seedPolls action instead:");
  console.log("    npx convex run seedPolls:seedFromFile");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
