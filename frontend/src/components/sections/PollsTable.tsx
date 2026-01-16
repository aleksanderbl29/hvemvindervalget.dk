import { PollHighlight } from "@/lib/api/types";

type PollsTableProps = {
  polls: PollHighlight[];
};

export function PollsTable({ polls }: PollsTableProps) {
  // Get all unique parties across all polls, sorted by average value
  const allParties = new Set<string>();
  polls.forEach((poll) => {
    poll.parties.forEach((p) => allParties.add(p.party));
  });

  const partyAverages = Array.from(allParties).map((party) => {
    const values = polls
      .flatMap((poll) => poll.parties.filter((p) => p.party === party))
      .map((p) => p.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { party, avg };
  });

  const sortedParties = partyAverages.sort((a, b) => b.avg - a.avg).map((p) => p.party);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Meningsmålinger</h3>
        <p className="text-sm text-slate-500">
          Oversigt over alle polls med partier som rækker.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 z-10 bg-white/95 py-3 pr-4 text-left">
                Pollster / Dato
              </th>
              {sortedParties.map((party) => (
                <th key={party} className="py-3 px-2 text-center font-medium">
                  {party}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {polls.map((poll) => (
              <tr
                key={`${poll.pollster}-${poll.conductedAt}`}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="sticky left-0 z-10 bg-white/95 py-3 pr-4">
                  <div>
                    <p className="font-medium text-slate-900">{poll.pollster}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(poll.conductedAt).toLocaleDateString("da-DK")}
                    </p>
                    <p className="text-xs text-slate-400">
                      n={poll.sampleSize} · {poll.methodology}
                    </p>
                  </div>
                </td>
                {sortedParties.map((party) => {
                  const partyResult = poll.parties.find((p) => p.party === party);
                  return (
                    <td key={party} className="py-3 px-2 text-center text-slate-700">
                      {partyResult ? (
                        <span className="font-medium">
                          {partyResult.value.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
