"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  students: Users,
  teachers: GraduationCap,
  courses: BookOpen,
  attendance: CalendarCheck,
  notices: Bell,
  enquiries: MessageSquare,
  settings: Settings,
  challans: FileText,
  quiz: ListChecks,
  quizbank: Library,
  assignments: ClipboardList,
  finance: Wallet,
  performance: Trophy,
  assessment: ClipboardCheck,
};

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Extra path prefixes that should also highlight this item. */
  match?: string[];
};

export function DashboardShell({
  user,
  nav,
  roleLabel,
  children,
}: {
  user: { name: string; email: string };
  nav: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center border-b border-slate-800 px-5">
          <Image
            src="/logos/main-logo.png"
            alt="SkillTek"
            width={2172}
            height={724}
            className="h-12 w-auto object-contain"
          />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = [item.href, ...(item.match ?? [])].some(
            (p) => pathname === p || pathname.startsWith(p + "/"),
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 bg-slate-900 lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            {roleLabel} Portal
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-700 sm:block">
              {user.name}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials(user.name)}
            </span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
