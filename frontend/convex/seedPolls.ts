import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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

/**
 * Seed polls data from polls.csv file
 * 
 * NOTE: Convex actions run on the server and don't have access to local filesystem.
 * This function reads the file from the project directory where the CLI runs.
 * 
 * Usage:
 *   npx convex run seedPolls:seedFromFile
 * 
 * Or with custom path:
 *   npx convex run seedPolls:seedFromFile --args '{"csvPath": "path/to/polls.csv"}'
 */
export const seedFromFile = action({
  args: {
    csvPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Note: This won't work in Convex actions as they don't have filesystem access.
    // This is a placeholder - use seedFromCsv with the file content instead.
    // For a working solution, read the file in a script and pass content to seedFromCsv.
    throw new Error(
      "seedFromFile doesn't work in Convex actions. Use seedFromCsv with file content, " +
      "or use the import-polls.ts script instead."
    );
  },
});

/**
 * Seed polls data from CSV string
 * 
 * Usage:
 *   npx convex run seedPolls:seedFromCsv --args '{"csvContent": "..."}'
 */
export const seedFromCsv = action({
  args: {
    csvContent: v.string(),
  },
  handler: async (ctx, args) => {
    const csvContent = args.csvContent;
    
    // Parse CSV
    const parseResult = Papa.parse<PollRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors.length > 0) {
      console.warn("CSV parsing warnings:", parseResult.errors);
    }

    const rows = parseResult.data;
    console.log(`Found ${rows.length} rows in CSV`);

    // Filter to only "all" segment rows
    const allSegmentRows = rows.filter((row) => row.segment === "all");
    console.log(`Found ${allSegmentRows.length} rows with segment="all"`);

    // Group rows by poll_date, pollster, and n (sample size) to identify unique polls
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

    console.log(`Found ${pollGroups.size} unique polls to import`);

    // Import polls
    let imported = 0;
    let errors = 0;
    const pollsterCache = new Map<string, Id<"pollsters">>(); // pollster name -> pollster ID

    for (const [key, group] of pollGroups) {
      try {
        // Get or create pollster
        let pollsterId = pollsterCache.get(group.pollster);
        if (!pollsterId) {
          console.log(`  Getting/creating pollster: ${group.pollster}`);
          pollsterId = await ctx.runMutation(
            api.ingestMutations.getOrCreatePollster,
            {
              name: group.pollster,
              code: group.pollster.toLowerCase().replace(/\s+/g, "-"),
            }
          );
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

        await ctx.runMutation(api.ingestMutations.createPollWithResults, {
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

    return {
      success: true,
      imported,
      errors,
      total: pollGroups.size,
    };
  },
});
