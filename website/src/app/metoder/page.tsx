export const metadata = {
  title: "Metoder | Hvem vinder valget?",
};

export default function MetoderPage() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /metoder (placeholder)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Metoder</h1>
      <p className="mt-2 text-sm text-slate-600">
        Kommer snart. Dokumentationen bliver genudgivet, når dataformatet er
        stabilt.
      </p>
    </main>
  );
}

