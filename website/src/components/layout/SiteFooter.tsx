export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <span aria-hidden="true">©</span>
          <span>
            {year} Hvem vinder valget?
          </span>
        </p>

        <a
          href="https://github.com/aleksanderbl29/hvemvindervalget.dk"
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-md px-2 py-1 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Besøg på GitHub
        </a>
      </div>
    </footer>
  );
}

