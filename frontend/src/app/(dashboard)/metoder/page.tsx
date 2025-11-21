"use client";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function MetoderPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Metoder</h2>
        <p className="mt-2 text-sm text-slate-500">
          Teoretisk baggrund og metoder bag modellens forudsigelser.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800">Modeloversigt</h3>
        <p className="text-slate-700">
          Modellen bruger lineær regression til at forudsige valgresultater baseret på
          meningsmålinger og historiske data. Den grundlæggende antagelse er, at der
          eksisterer en lineær sammenhæng mellem inputvariabler og det forventede
          valgresultat.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800">
          Lineær Regression
        </h3>
        <p className="text-slate-700">
          Den grundlæggende model er en simpel lineær regression, hvor vi modellerer
          forholdet mellem en uafhængig variabel <InlineMath math="x" /> og en afhængig
          variabel <InlineMath math="y" />. Modellen kan beskrives som:
        </p>
        <div className="my-6 rounded-lg bg-slate-50 p-6">
          <BlockMath math="y = \beta_0 + \beta_1 x + \epsilon" />
        </div>
        <p className="text-slate-700">
          hvor <InlineMath math="\beta_0" /> er skæringen (intercept),{" "}
          <InlineMath math="\beta_1" /> er hældningskoefficienten (slope), og{" "}
          <InlineMath math="\epsilon" /> er fejlleddet (error term).
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800">Forudsigelsesformel</h3>
        <p className="text-slate-700">
          Når modellen er estimeret, kan vi bruge den til at lave forudsigelser. Den
          forudsagte værdi <InlineMath math="\hat{y}" /> beregnes som:
        </p>
        <div className="my-6 rounded-lg bg-slate-50 p-6">
          <BlockMath math="\hat{y} = \beta_0 + \beta_1 x" />
        </div>
        <p className="text-slate-700">
          hvor <InlineMath math="\hat{y}" /> er den forudsagte værdi baseret på den
          estimerede model.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800">Fejlmåling</h3>
        <p className="text-slate-700">
          For at evaluere modellens præcision bruger vi gennemsnitlig kvadratisk fejl
          (Mean Squared Error, MSE). MSE beregnes som:
        </p>
        <div className="my-6 rounded-lg bg-slate-50 p-6">
          <BlockMath math="MSE = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2" />
        </div>
        <p className="text-slate-700">
          hvor <InlineMath math="n" /> er antallet af observationer,{" "}
          <InlineMath math="y_i" /> er den faktiske værdi, og{" "}
          <InlineMath math="\hat{y}_i" /> er den forudsagte værdi for observation{" "}
          <InlineMath math="i" />.
        </p>
      </section>
    </div>
  );
}

