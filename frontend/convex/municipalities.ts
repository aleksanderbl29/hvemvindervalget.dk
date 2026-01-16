import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const municipalities = await ctx.db.query("municipality_snapshots").collect();
    
    // Fetch region info for each municipality
    const municipalitiesWithRegions = await Promise.all(
      municipalities.map(async (municipality) => {
        const region = municipality.regionId
          ? await ctx.db.get(municipality.regionId)
          : null;
        
        return {
          ...municipality,
          region: region?.shortName || region?.name || "Unknown",
        };
      }),
    );
    
    return municipalitiesWithRegions;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const municipality = await ctx.db
      .query("municipality_snapshots")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!municipality) {
      return null;
    }
    
    // Fetch region info
    const region = municipality.regionId
      ? await ctx.db.get(municipality.regionId)
      : null;
    
    return {
      ...municipality,
      region: region?.shortName || region?.name || "Unknown",
    };
  },
});
