import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_probability")
      .order("desc")
      .collect();
    return scenarios;
  },
});
