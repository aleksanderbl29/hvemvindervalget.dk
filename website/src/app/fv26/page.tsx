export const metadata = {
  title: "Folketingsvalget 2026 | Hvem vinder valget?",
};

export default function Folketingsvalget2026Page() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /fv26 (placeholder)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        Folketingsvalget 2026
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900">
        Hvem vinder valget?
      </h1>
      <p className="mt-4 text-base text-slate-600">
        Kommer snart. Denne side er en placeholder, mens vi bygger indhold og
        navigation.
      </p>
    </main>
  );
}

