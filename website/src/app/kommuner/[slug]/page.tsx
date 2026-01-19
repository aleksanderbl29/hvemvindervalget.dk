type MunicipalityPageProps = {
  params: { slug: string };
};

export default function MunicipalityPage({ params }: MunicipalityPageProps) {
  if (process.env.NODE_ENV === "development") {
    console.info("[route] /kommuner/[slug] (placeholder)", { slug: params.slug });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Kommune</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {params.slug}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Kommer snart. Kommunevisningerne er midlertidigt slået fra.
      </p>
    </main>
  );
}

