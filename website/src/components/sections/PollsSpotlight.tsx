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
      <div className="space-y-4">
        {polls.map((poll) => (
          <article
            key={`${poll.pollster}-${poll.conductedAt}`}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {poll.pollster}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {new Date(poll.conductedAt).toLocaleDateString("da-DK")} · n=
                  {poll.sampleSize} · {poll.methodology}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {poll.parties.slice(0, 6).map((party) => (
                  <span
                    key={party.party}
                    className="rounded-full border border-slate-200 px-2 py-1 font-medium"
                  >
                    {party.party} {party.value.toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

