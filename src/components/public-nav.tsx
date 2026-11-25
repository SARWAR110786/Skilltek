"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Smartphone, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Programs" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/admissions", label: "Admissions" },
  // "Download App" is already reachable from the Get App button (desktop and
  // mobile), so its slot is used for student/certificate verification.
  { href: "/verify", label: "Verify Status" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logos/main-logo.png"
            alt="SkillTek Institute"
            width={2172}
            height={724}
            className="h-14 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-slate-300 hover:text-white",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/download"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-400 hover:bg-brand-600/20"
          >
            <Smartphone className="h-4 w-4" />
            Get App
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <User className="h-4 w-4" />
            Login Portal
          </Link>
        </div>

        <button
          className="rounded-md p-2 text-slate-300 hover:bg-white/5 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  pathname === l.href
                    ? "text-white"
                    : "text-slate-300 hover:bg-white/5",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              <Smartphone className="h-4 w-4" />
              Get the App
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              <User className="h-4 w-4" />
              Login Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
