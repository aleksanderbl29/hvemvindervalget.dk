import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const overview = await ctx.db.query("national_overview").first();
    return overview;
  },
});
