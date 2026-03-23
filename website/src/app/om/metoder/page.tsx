import type { Metadata } from "next";
import { Link } from "@/components/ui/Link";
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
          <Link href="/om" className="hover:text-slate-700 transition">
            Om
          </Link>
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
            tildeles en vægt baseret på dens <em>alder</em> og <em>stikprøvestørrelse</em>:
          </p>

          <BlockMath math="w_i \;=\; w_{\text{tid},i} \times w_{\text{størrelse},i}" />

          <p>
            Hvor tidsvægten har en halveringstid på 14 dage. Det betyder at en 14 dage gammel måling <em>vejer</em> halvt så meget som en ny måling.
          </p>

          <BlockMath math="w_{\text{tid},i} \;=\; 2^{-a_i \,/\, 14}" />

          <p>
            Derudover tilføjer vi en vægt for stikprøvestørrelsen, der øges med antallet af respondenter. Her udregnes vægten med kvadratroden af <em>n</em> for at få en aftagende marginalvægt.
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Sådan laver modellen en prognose
          </h2>

          <p>
            Det vægtede gennemsnit er kun første skridt. Selve prognosemodellen prøver
            derefter at svare på et lidt større spørgsmål: Hvis der var valg i dag, hvad
            er så det mest sandsynlige resultat?
          </p>

          <p>
            Modellen tager udgangspunkt i de nyeste meningsmålinger, men den kigger også
            på, om nogle analyseinstitutter ofte ligger lidt højere eller lavere for bestemte
            partier. På den måde forsøger modellen at skelne mellem en reel bevægelse i
            vælgerne og forskelle i måden, målingerne bliver lavet på.
          </p>

          <p>
            Samtidig bruger modellen tidligere valgresultater som et slags startpunkt. Det
            gør især en forskel, når der er få friske målinger, eller når usikkerheden er
            stor. Historikken bestemmer ikke resultatet, men hjælper modellen med at holde
            sig til det, der virker realistisk.
          </p>

          <p>
            I stedet for kun at lave ét enkelt bud beregner modellen mange mulige valgudfald.
            Nogle udfald giver lidt mere til et parti, andre lidt mindre. Til sidst samles
            de mange beregninger til det gennemsnit og det usikkerhedsinterval, der vises på
            siden.
          </p>

          <p>
            Når stemmeprognosen er klar, bliver den oversat til mandater. Her tager modellen
            højde for, at mandater fordeles i storkredse og ikke kun på landsplan. Derfor kan
            to partier med næsten samme stemmeandel godt ende med forskelligt antal mandater.
          </p>

          <p className="text-sm text-slate-500 pt-2">
            Den fulde implementering kan ses i{" "}
            <InlineLink href="https://github.com/aleksanderbl29/hvemvindervalget.dk/blob/main/pipeline/R/model.R">
              model.R
            </InlineLink>
            ,{" "}
            <InlineLink href="https://github.com/aleksanderbl29/hvemvindervalget.dk/blob/main/pipeline/R/national_prior.R">
              national_prior.R
            </InlineLink>
            ,{" "}
            <InlineLink href="https://github.com/aleksanderbl29/hvemvindervalget.dk/blob/main/pipeline/R/storkreds_prior.R">
              storkreds_prior.R
            </InlineLink>{" "}
            og{" "}
            <InlineLink href="https://github.com/aleksanderbl29/hvemvindervalget.dk/blob/main/pipeline/R/seats.R">
              seats.R
            </InlineLink>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

