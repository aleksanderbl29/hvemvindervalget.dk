import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const municipalities = await ctx.db.query("municipality_snapshots").collect();
    return municipalities;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const municipality = await ctx.db
      .query("municipality_snapshots")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return municipality;
  },
});
