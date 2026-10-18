export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-4 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-40 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}
