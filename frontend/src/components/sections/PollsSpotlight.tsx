import { PollHighlight } from "@/lib/api/types";

type PollsSpotlightProps = {
  polls: PollHighlight[];
};

export function PollsSpotlight({ polls }: PollsSpotlightProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Seneste målinger</h3>
        <p className="text-sm text-slate-500">
          Fokus på polls publiceret de sidste 14 dage.
        </p>
      </header>
      <div className="space-y-6">
        {polls.map((poll) => (
          <article
            key={`${poll.pollster}-${poll.conductedAt}`}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">
                {poll.pollster}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {new Date(poll.conductedAt).toLocaleDateString("da-DK")} · n=
                {poll.sampleSize} · {poll.methodology}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Parti</th>
                    <th className="py-2 pr-4 text-right">Stemmer (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {poll.parties
                    .sort((a: { party: string; value: number }, b: { party: string; value: number }) => b.value - a.value)
                    .map((party: { party: string; value: number }) => (
                      <tr
                        key={party.party}
                        className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/50"
                      >
                        <td className="py-2 pr-4 font-medium">{party.party}</td>
                        <td className="py-2 pr-4 text-right">
                          {party.value.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

