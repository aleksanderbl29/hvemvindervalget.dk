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
