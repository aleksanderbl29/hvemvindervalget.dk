import { ReactNode } from "react";
import type { ChartSummary } from "@/lib/api/types";
import { ChartRenderer } from "../charts/ChartRenderer";

type ChartShellProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  chart?: ChartSummary;
  showMeta?: boolean;
  variant?: "default" | "bare";
  className?: string;
};

export function ChartShell({
  title,
  description,
  children,
  chart,
  showMeta = true,
  variant = "default",
  className,
}: ChartShellProps) {
  const outerClassName =
    variant === "bare"
      ? `w-full ${className ?? ""}`
      : `rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm ${className ?? ""}`;

  const innerClassName =
    variant === "bare"
      ? "h-full flex flex-col"
      : "min-h-[320px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center text-sm text-slate-500";

  return (
    <section className={outerClassName}>
      <header className={variant === "bare" ? "mb-4" : "mb-4"}>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </header>
      <div className={innerClassName}>
        {chart ? (
          <ChartRenderer chart={chart} />
        ) : (
          <div className={variant === "bare" ? "flex-1" : ""}>
            {children ?? "Visualisering kommer her."}
          </div>
        )}
      </div>
      {showMeta && chart ? (
        <footer className="mt-3 text-xs text-slate-500">
          Opdateret {new Date(chart.updatedAt).toLocaleString("da-DK")} · Kilde: {chart.dataSource}
        </footer>
      ) : null}
    </section>
  );
}

