import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const regions = await ctx.db.query("regions").collect();
    return regions.sort((a, b) => a.order - b.order);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const region = await ctx.db
      .query("regions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    return region;
  },
});
