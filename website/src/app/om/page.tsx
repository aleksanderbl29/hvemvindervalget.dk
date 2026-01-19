export const metadata = {
  title: "Om | Hvem vinder valget?",
};

export default function AboutPage() {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /om (placeholder)");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-4xl font-semibold text-slate-900">Om</h1>
      <p className="mt-4 text-base text-slate-600">
        Kommer snart. Her beskriver vi formål, datakilder og metode for
        prognoserne.
      </p>
    </main>
  );
}

