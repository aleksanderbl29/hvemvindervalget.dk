import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const parties = await ctx.db.query("parties").collect();
    return parties.sort((a, b) => a.order - b.order);
  },
});

export const getByLetter = query({
  args: { letter: v.string() },
  handler: async (ctx, args) => {
    const party = await ctx.db
      .query("parties")
      .withIndex("by_letter", (q) => q.eq("letter", args.letter))
      .first();
    return party;
  },
});
