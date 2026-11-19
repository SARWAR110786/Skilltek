import Link from "next/link";
import { BarChart3, FileText, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "challans", href: "/admin/challans", label: "Challans", icon: FileText },
  { key: "expenses", href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { key: "reports", href: "/admin/reports", label: "Monthly Report", icon: BarChart3 },
] as const;

export function FinanceTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              t.key === active
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
