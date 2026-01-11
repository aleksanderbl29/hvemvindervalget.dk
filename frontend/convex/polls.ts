import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_conducted_at")
      .order("desc")
      .collect();
    return polls;
  },
});
