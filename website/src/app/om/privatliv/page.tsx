import type { Metadata } from "next";
import Link from "next/link";
import { InlineLink } from "@/components/ui/InlineLink";

export const metadata: Metadata = {
  title: "Privatliv | Hvem vinder valget?",
  description:
    "Læs om, hvordan hvemvindervalget.dk indsamler og behandler data om besøgende.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <nav className="mb-8 text-sm text-slate-500 flex items-center justify-between">
        <div>
          <Link href="/om" className="hover:text-slate-700 transition">
            Om
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Privatliv</span>
        </div>
        <a
          href="https://github.com/aleksanderbl29/hvemvindervalget.dk/commits/main/website/src/app/om/privatliv/page.tsx"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-700 transition"
        >
          Versionshistorik
        </a>
      </nav>

      <h1 className="text-4xl font-semibold text-slate-900">Privatliv</h1>
      <p className="mt-3 text-sm text-slate-500">Sidst opdateret: 5. marts 2026.</p>

      <section className="mt-10 space-y-8 text-base text-slate-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Hvad indsamler vi?
          </h2>
          <p>
            Vi indsamler anonymiserede brugsdata for at forstå, hvordan
            besøgende bruger siden. Konkret registreres:
          </p>
          <ul className="mt-3 space-y-1 list-disc list-inside text-slate-600">
            <li>Hvilke sider der besøges, og hvor længe</li>
            <li>Hvorfra besøget kommer (f.eks. søgemaskine eller direkte link)</li>
            <li>Browser og operativsystem</li>
            <li>Enhedstype (mobil, tablet eller computer)</li>
            <li>Land baseret på IP-adresse — selve IP-adressen gemmes ikke</li>
          </ul>
          <p className="mt-3">
            Der indsamles ingen personoplysninger. Det er ikke muligt at
            identificere individuelle besøgende, og besøgende spores ikke på
            tværs af hjemmesider.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Ingen cookies
          </h2>
          <p>
            Vi bruger ingen cookies til analyse eller sporing. Du behøver ikke acceptere
            noget cookiebanner.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Analyse af brugsdata
          </h2>
          <p>
            Brugsdata behandles via{" "}
            <InlineLink href="https://umami.is" target="_blank" rel="noopener noreferrer">
              Umami
            </InlineLink>
            , et open source-analyseværktøj.
            Programmet hostes lokalt i <InlineLink href="https://aleksanderbl.dk/" target="_blank" rel="noopener noreferrer">Aleksanders</InlineLink> lejlighed i Aarhus.
            Vi deler aldrig data med tredjeparter.
            For at se mere om, hvordan Umami er hostet kan du se <InlineLink href="https://github.com/aleksanderbl29/nix-config/commit/65177939906a40ab336ee891ad5c04423835713d" target="_blank" rel="noopener noreferrer">Aleksanders konfiguration af Umami</InlineLink> her.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Spørgsmål
          </h2>
          <p>
            Da vi ikke indsamler personoplysninger, er der ingen persondata at
            tilgå, rette eller slette. Har du spørgsmål til vores brug af
            data, Umami eller andet, er du velkommen til at kontakte <InlineLink href="mailto:privatliv@aleksanderbl.dk">privatliv@aleksanderbl.dk</InlineLink>.
          </p>
        </div>
      </section>
    </main>
  );
}
