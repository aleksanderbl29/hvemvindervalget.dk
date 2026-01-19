export const metadata = {
  title: "Meningsmålinger | Hvem vinder valget?",
};

export default function PollsPage() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /polls (placeholder)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Meningsmålinger</h1>
      <p className="mt-2 text-sm text-slate-600">
        Kommer snart. Data og visualiseringer er under stabilisering.
      </p>
    </main>
  );
}

