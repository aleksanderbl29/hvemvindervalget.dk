import Link from "next/link";

const previousElections = [{ label: "Kommunalvalg 2025", href: "/kv25" }];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="rounded-lg px-2 py-1 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
          aria-label="Gå til forsiden"
        >
          Hvem vinder valget?
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/fv26"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Folketingsvalg 2026
          </Link>

          <details className="relative">
            <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400">
              Tidl. valg
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="py-2">
                {previousElections.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </details>

          <Link
            href="/om"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400"
          >
            Om
          </Link>

        </div>
      </div>
    </header>
  );
}

