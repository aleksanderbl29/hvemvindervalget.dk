import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metoder | hvemvindervalget.dk",
  description: "Læs om, hvordan hvemvindervalget.dk beregner valgprognoserne.",
};

export default function MetoderPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/om" className="hover:text-slate-700 transition">
          Om
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Metoder</span>
      </nav>
      <h1 className="text-4xl font-semibold text-slate-900">Metoder</h1>

      <section className="mt-10 space-y-8 text-base text-slate-700 leading-relaxed">
        <p>Kommer snart.</p>
      </section>
    </main>
  );
}

