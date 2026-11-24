"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void reset;
  useEffect(() => {
    console.error(error);
    // After a site update, a page opened before the update can't talk to the
    // new server ("Server Action not found", old JS chunks, dropped stream).
    // A fresh page load fixes it, so do that automatically — once per minute
    // at most, to avoid a reload loop.
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    const stale =
      /Server Action .* (was )?not found|UnrecognizedActionError|Failed to find Server Action|ChunkLoadError|Loading chunk|Minified React error #412|Connection closed/i.test(
        msg,
      );
    if (stale) {
      try {
        const last = Number(sessionStorage.getItem("st-stale-reload") || 0);
        if (Date.now() - last > 60_000) {
          sessionStorage.setItem("st-stale-reload", String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <div className="animate-pop-in relative mb-8">
        <div className="absolute inset-0 animate-orbit rounded-full bg-rose-200/40 blur-xl" />
        <div className="absolute inset-0 animate-orbit-reverse rounded-full bg-amber-200/30 blur-lg" />
        <div className="animate-wobble relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-2xl shadow-rose-200">
          <AlertTriangle className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white shadow-lg">
            !
          </span>
        </div>
      </div>

      <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Oops! Something went wrong
      </h1>
      <p className="animate-fade-in-up-delay mt-3 max-w-md text-base leading-relaxed text-slate-500">
        Don&apos;t worry — it&apos;s not you, it&apos;s us. An unexpected error occurred while
        processing your request. Please try again in a moment.
      </p>

      <div className="animate-fade-in-up-delay-2 mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/">
          <Button variant="secondary">
            <Home className="h-4 w-4" /> Go home
          </Button>
        </Link>
      </div>

      <p className="animate-fade-in-up-delay-2 mt-6 text-xs text-slate-400">
        If this keeps happening, please contact support.
      </p>
    </div>
  );
}
