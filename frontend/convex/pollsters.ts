import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const pollsters = await ctx.db.query("pollsters").collect();
    return pollsters.sort((a, b) => a.order - b.order);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const pollster = await ctx.db
      .query("pollsters")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    return pollster;
  },
});
