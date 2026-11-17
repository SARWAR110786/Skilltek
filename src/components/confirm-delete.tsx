"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

export function ConfirmDelete({
  action,
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
  triggerClassName = "rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600",
  fields,
  children,
}: {
  action: (formData: FormData) => void;
  message?: string;
  confirmLabel?: string;
  triggerClassName?: string;
  fields?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
        aria-label="Delete"
      >
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">Confirm delete</h3>
              <p className="mt-2 text-sm text-slate-600">{message}</p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <form
                ref={formRef}
                action={action}
                onSubmit={() => {
                  setPending(true);
                  setOpen(false);
                }}
              >
                {fields}
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending ? "Deleting..." : confirmLabel}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
