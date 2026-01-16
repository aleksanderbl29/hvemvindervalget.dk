import Link from "next/link";
import { MunicipalityWithRegion } from "@/lib/api/types";

type MunicipalityTableProps = {
  municipalities: MunicipalityWithRegion[];
};

export function MunicipalityTable({ municipalities }: MunicipalityTableProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Kommuner i fokus
          </h3>
          <p className="text-sm text-slate-500">
            Prioriteret efter bevægelse og demografi.
          </p>
        </div>
        {municipalities[0] && (
          <Link
            href={`/kommuner/${municipalities[0].slug}`}
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
          >
            Gå til detaljer
          </Link>
        )}
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Kommune</th>
              <th className="py-2 pr-4">Region</th>
              <th className="py-2 pr-4">Førende parti</th>
              <th className="py-2 pr-4">Andel</th>
              <th className="py-2 pr-4">Valgdeltagelse</th>
            </tr>
          </thead>
          <tbody>
            {municipalities.map((municipality) => (
              <tr
                key={municipality.slug}
                className="border-t border-slate-100 text-sm hover:bg-slate-50/70"
              >
                <td className="py-3 pr-4 font-medium">
                  <Link
                    href={`/kommuner/${municipality.slug}`}
                    className="text-slate-900 hover:underline"
                  >
                    {municipality.name}
                  </Link>
                </td>
                <td className="py-3 pr-4">{municipality.region}</td>
                <td className="py-3 pr-4">{municipality.leadingParty}</td>
                <td className="py-3 pr-4">
                  {municipality.voteShare.toFixed(1)}%
                </td>
                <td className="py-3 pr-4">{municipality.turnout.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

