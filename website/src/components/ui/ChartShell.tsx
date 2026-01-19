import { ReactNode } from "react";
import type { ChartSummary } from "@/lib/api/types";
import { ChartRenderer } from "../charts/ChartRenderer";

type ChartShellProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  chart?: ChartSummary;
};

export function ChartShell({ title, description, children, chart }: ChartShellProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </header>
      <div className="min-h-[240px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center text-sm text-slate-500">
        {chart ? (
          <ChartRenderer chart={chart} />
        ) : (
          children ?? "Visualisering kommer her (Plotly/ECharts)."
        )}
      </div>
      {chart ? (
        <footer className="mt-3 text-xs text-slate-500">
          Opdateret {new Date(chart.updatedAt).toLocaleString("da-DK")} · Kilde: {chart.dataSource}
        </footer>
      ) : null}
    </section>
  );
}

