export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function PageLoading({
  title,
  rows = 6,
  variant = "table",
}: {
  title?: string;
  rows?: number;
  variant?: "table" | "cards" | "form";
}) {
  return (
    <div className="p-4 lg:p-8" role="status" aria-label="Loading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className={title ? "hidden" : "h-8 w-52"} />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {variant === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {variant === "table" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-9 w-28" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
}
