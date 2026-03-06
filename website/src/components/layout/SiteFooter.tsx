export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 text-sm text-slate-600 sm:px-6">
        <p className="flex items-center gap-1.5">
          <span aria-hidden="true">©</span>
          <span>{year} Hvem vinder valget?</span>
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

