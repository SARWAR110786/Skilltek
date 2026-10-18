import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <div className="animate-pop-in relative mb-8">
        <div className="absolute inset-0 animate-orbit rounded-full bg-slate-200/40 blur-xl" />
        <div className="absolute inset-0 animate-orbit-reverse rounded-full bg-brand-200/30 blur-lg" />
        <div className="animate-wobble relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-2xl shadow-slate-200">
          <SearchX className="h-12 w-12 text-white drop-shadow" strokeWidth={2.5} />
          <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-lg">
            404
          </span>
        </div>
      </div>

      <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="animate-fade-in-up-delay mt-3 max-w-md text-base leading-relaxed text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get
        you back on track.
      </p>

      <div className="animate-fade-in-up-delay-2 mt-8">
        <Link href="/">
          <Button>
            <Home className="h-4 w-4" /> Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
