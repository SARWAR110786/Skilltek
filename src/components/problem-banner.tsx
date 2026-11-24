"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, X } from "lucide-react";

const MESSAGES: Record<string, string> = {
  duplicate:
    "This already exists — for example the email, CNIC, code or title is already in use. Please change it and try again.",
  notfound: "That item was already removed or changed by someone else. The page has been refreshed.",
  inuse: "This can't be deleted because other records are linked to it (for example a course that still has students). Remove those first.",
  busy: "The connection to the server dropped or it was busy for a moment. Please try again.",
  failed: "That didn't save. Please check the form and try again. If it keeps happening, contact the admin.",
};

/** Friendly message for a failed action (?problem=…), shown on the same page. */
export function ProblemBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const code = params.get("problem");
  if (!code || !MESSAGES[code]) return null;

  function dismiss() {
    const next = new URLSearchParams(params.toString());
    next.delete("problem");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p className="flex-1 leading-relaxed">{MESSAGES[code]}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
