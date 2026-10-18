"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <p className="text-sm text-rose-600">Something went wrong while loading challans.</p>
      <button
        onClick={reset}
        className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
