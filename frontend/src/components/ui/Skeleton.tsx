export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className}`}
      aria-label="Loading..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="overflow-x-auto">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl bg-white/60 p-4 shadow-inner">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
