"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void reset;
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
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
          We hit a snag
        </h1>
        <p className="animate-fade-in-up-delay mt-3 max-w-md text-base leading-relaxed text-slate-500">
          An unexpected error occurred. Please try again, or return to the homepage.
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
      </body>
    </html>
  );
}
