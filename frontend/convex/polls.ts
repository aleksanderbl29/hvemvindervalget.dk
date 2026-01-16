import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_conducted_at")
      .order("desc")
      .collect();

    // For each poll, fetch its party results and pollster info
    const pollsWithResults = await Promise.all(
      polls.map(async (poll) => {
        const results = await ctx.db
          .query("poll_results")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();

        const pollster = poll.pollsterId
          ? await ctx.db.get(poll.pollsterId)
          : null;

        return {
          ...poll,
          pollster: pollster?.name || "Unknown",
          pollsterCode: pollster?.code || null,
          parties: results.map((r) => ({
            party: r.party,
            value: r.value,
          })),
        };
      }),
    );

    return pollsWithResults;
  },
});
