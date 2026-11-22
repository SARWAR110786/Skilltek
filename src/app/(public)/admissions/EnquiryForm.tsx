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

function Field({
  label,
  children,
  required,
  optional,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-400" aria-hidden="true">*</span>}
        {optional && <span className="ml-1 text-xs font-normal text-slate-500">(optional)</span>}
      </span>
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
    if (!value.trim()) return "Please enter your phone number";
    return normalizePhone(value)
      ? null
      : "Please enter an 11-digit phone number, e.g. 03001234567";
  }

  function handlePhoneChange(value: string) {
    // Digits only: letters and symbols are dropped as they are typed or pasted.
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setPhone(digits);
    if (phoneError && !validatePhone(digits)) setPhoneError(null);
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
          {serviceOptions?.length
            ? "Your request has been received. Our team will contact you soon."
            : "Your admission form has been received. Our admissions team will contact you soon."}
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
        <Field label="Full name" required>
          <Input name="name" placeholder="Your name" required maxLength={120} />
        </Field>
        <Field label="Phone" required>
          <Input
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            pattern="[0-9]{11}"
            title="11-digit phone number, e.g. 03001234567"
            required
            value={phone}
            onChange={(event) => handlePhoneChange(event.target.value)}
            onBlur={(event) => setPhoneError(validatePhone(event.target.value))}
            placeholder="03001234567"
            maxLength={11}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? "phone-error" : undefined}
          />
          {phoneError && (
            <span id="phone-error" className="mt-1 block text-xs text-rose-300">
              {phoneError}
            </span>
          )}
        </Field>
        <Field label="Email" required>
          <Input name="email" type="email" placeholder="you@email.com" required maxLength={254} />
        </Field>
        {options && (
          <Field label="Service of interest" required>
            <Select
              name="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
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
          <Field label="Please specify" required>
            <Input name="serviceOther" placeholder="Which service do you need?" required maxLength={120} />
          </Field>
        )}
        {showCourse && (
          <Field label="Interested course" required={courses.length > 0}>
            <Select name="courseId" defaultValue="" required={courses.length > 0}>
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
      <Field label="Message" optional>
        <Textarea
          name="message"
          maxLength={3000}
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
            <Send className="h-4 w-4" /> {serviceOptions?.length ? "Send Request" : "Submit Admission Form"}
          </>
        )}
      </button>
    </form>
  );
}
