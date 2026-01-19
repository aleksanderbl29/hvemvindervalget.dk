export const metadata = {
  title: "Scenarier | Hvem vinder valget?",
};

export default function ScenarierPage() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /scenarier (placeholder)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Scenarier</h1>
      <p className="mt-2 text-sm text-slate-600">
        Kommer snart. Scenarieanalyserne er midlertidigt slået fra.
      </p>
    </main>
  );
}

