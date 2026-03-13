import type { Metadata } from "next";
import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { InlineLink } from "@/components/ui/InlineLink";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Metoder | hvemvindervalget.dk",
  description: "Læs om, hvordan hvemvindervalget.dk beregner valgprognoserne.",
};

export default function MetoderPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <nav className="mb-8 text-sm text-slate-500 flex items-center justify-between">
        <div>
          <PrefetchLink href="/om" className="hover:text-slate-700 transition">
            Om
          </PrefetchLink>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Metoder</span>
        </div>
        <a
          href="https://github.com/aleksanderbl29/hvemvindervalget.dk/commits/main/website/src/app/om/metoder/page.tsx"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-700 transition"
        >
          Versionshistorik
        </a>
      </nav>
      <h1 className="text-4xl font-semibold text-slate-900">Metoder</h1>

      <section className="mt-10 space-y-8 text-base text-slate-700 leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Vægtet gennemsnit af meningsmålingerne
          </h2>

          <p>
            Alle meningsmålinger kombineres til ét vægtet gennemsnit, hvor hver måling
            tildeles en vægt baseret på dens <em>alder</em> og{" "}
            <em>stikprøvestørrelse</em>:
          </p>

          <BlockMath math="w_i \;=\; w_{\text{tid},i} \times w_{\text{størrelse},i}" />

          <p>
            Hvor tidsvægten halveres for hver 14 dage, der går siden målingen:
          </p>

          <BlockMath math="w_{\text{tid},i} \;=\; 2^{-a_i \,/\, 14}" />

          <p>
            Og stikprøvevægten øges med antallet af respondenter:
          </p>

          <BlockMath math="w_{\text{størrelse},i} \;=\; \sqrt{n_i}" />

          <p>Den estimerede stemmeandel for parti <InlineMath math="p" /> er altså:</p>

          <BlockMath math="\hat{v}_p \;=\; \frac{\sum_{i} w_i\, v_{ip}}{\sum_{i} w_i}" />

          <p className="text-sm text-slate-500 pt-2">
            Den fulde implementering kan ses i{" "}
            <InlineLink href="https://github.com/aleksanderbl29/hvemvindervalget.dk/blob/main/pipeline/R/polls.R#L97-L126">
              polls.R
            </InlineLink>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

