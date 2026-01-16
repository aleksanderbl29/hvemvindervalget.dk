import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insertRecord = mutation({
  args: {
    table: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { table, data } = args;

    // For national_overview, we typically want to replace the existing record
    if (table === "national_overview") {
      const existing = await ctx.db.query("national_overview").first();
      if (existing) {
        await ctx.db.replace(existing._id, data);
        return { _id: existing._id };
      }
    }

    // For other tables, insert new records
    const _id = await ctx.db.insert(table as any, data);
    return { _id };
  },
});

export const getOrCreatePollster = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { name, code } = args;
    
    // Try to find by code first if provided
    if (code) {
      const existing = await ctx.db
        .query("pollsters")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (existing) {
        return existing._id;
      }
    }
    
    // Try to find by name (case-insensitive)
    const allPollsters = await ctx.db.query("pollsters").collect();
    const existingByName = allPollsters.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existingByName) {
      return existingByName._id;
    }
    
    // Create new pollster
    const pollsterCode = code || name.toLowerCase().replace(/\s+/g, "-");
    const maxOrder = allPollsters.length > 0
      ? Math.max(...allPollsters.map((p) => p.order))
      : 0;
    
    const _id = await ctx.db.insert("pollsters", {
      code: pollsterCode,
      name: name,
      order: maxOrder + 1,
    });
    
    return _id;
  },
});

export const createPollWithResults = mutation({
  args: {
    pollsterId: v.id("pollsters"),
    conductedAt: v.string(),
    sampleSize: v.number(),
    methodology: v.string(),
    results: v.array(
      v.object({
        party: v.string(),
        value: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { pollsterId, conductedAt, sampleSize, methodology, results } = args;
    
    // Create the poll
    const pollId = await ctx.db.insert("polls", {
      pollsterId,
      conductedAt,
      sampleSize,
      methodology,
    });
    
    // Create poll results
    for (const result of results) {
      await ctx.db.insert("poll_results", {
        pollId,
        party: result.party,
        value: result.value,
      });
    }
    
    return { pollId };
  },
});
