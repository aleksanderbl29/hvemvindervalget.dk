export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
      <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
    </div>
  );
}

