import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  trend?: number;
};

export function StatCard({ label, value, helper, trend }: StatCardProps) {
  const trendColor =
    trend === undefined
      ? ""
      : trend >= 0
        ? "text-emerald-600"
        : "text-rose-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
        {helper && <span>{helper}</span>}
        {trend !== undefined && (
          <span className={trendColor}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)} pp
          </span>
        )}
      </div>
    </div>
  );
}

