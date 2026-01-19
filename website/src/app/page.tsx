export const metadata = {
  title: "Hvem vinder valget? | Kommunalvalg 2025",
};

export default function HomePage() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] / (home)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        Kommunalvalg 2025
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900">
        Hvem vinder valget?
      </h1>
      <p className="mt-4 text-base text-slate-600">
        Sitet er under oprydning, mens dataformatet stabiliseres. Indholdet kommer
        løbende tilbage.
      </p>
    </main>
  );
}
