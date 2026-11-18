"use client";

import {
  useActionState,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/validation";
import { submitEnquiry, type EnquiryState } from "@/app/(public)/admissions/actions";

// Dark-theme controls for the public site. The shared Input/Select/Field in
// components/ui are white and stay that way for the admin panel.
const CONTROL =
  "w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, className)} {...props} />;
}

function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(CONTROL, "cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function EnquiryForm({
  courses,
  showCourse = true,
  compact = false,
  serviceOptions,
}: {
  courses: { id: string; title: string }[];
  showCourse?: boolean;
  compact?: boolean;
  serviceOptions?: string[];
}) {
  const [state, formAction, pending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    {},
  );
  const [service, setService] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  function validatePhone(value: string): string | null {
    if (!value.trim()) return null;
    return normalizePhone(value)
      ? null
      : "Please enter a valid phone number";
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (phoneError && !validatePhone(value)) setPhoneError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }
    setPhoneError(null);
    formAction(new FormData(event.currentTarget));
  }

  const options =
    serviceOptions && serviceOptions.length > 0
      ? serviceOptions.includes("Other")
        ? serviceOptions
        : [...serviceOptions, "Other"]
      : undefined;

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.08] p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-300" />
        <p className="font-semibold text-white">Thank you!</p>
        <p className="text-sm text-slate-300">
          Your enquiry has been received. Our team will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200">
          {state.error}
        </div>
      )}
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Full name">
          <Input name="name" placeholder="Your name" required />
        </Field>
        <Field label="Phone">
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => handlePhoneChange(event.target.value)}
            onBlur={(event) => setPhoneError(validatePhone(event.target.value))}
            placeholder="0300-1234567"
            maxLength={20}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? "phone-error" : undefined}
          />
          {phoneError && (
            <span id="phone-error" className="mt-1 block text-xs text-rose-300">
              {phoneError}
            </span>
          )}
        </Field>
        <Field label="Email">
          <Input name="email" type="email" placeholder="you@email.com" />
        </Field>
        {options && (
          <Field label="Service of interest">
            <Select
              name="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">Select a service</option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {service === "Other" && (
          <Field label="Please specify">
            <Input name="serviceOther" placeholder="Which service do you need?" />
          </Field>
        )}
        {showCourse && (
          <Field label="Interested course">
            <Select name="courseId" defaultValue="">
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <Field label="Message">
        <Textarea
          name="message"
          rows={compact ? 3 : 4}
          placeholder="Tell us how we can help…"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit Enquiry
          </>
        )}
      </button>
    </form>
  );
}
