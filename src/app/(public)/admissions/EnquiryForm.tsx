"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { submitEnquiry, type EnquiryState } from "@/app/(public)/admissions/actions";

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
  const options =
    serviceOptions && serviceOptions.length > 0
      ? serviceOptions.includes("Other")
        ? serviceOptions
        : [...serviceOptions, "Other"]
      : undefined;

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <p className="font-semibold text-emerald-800">Thank you!</p>
        <p className="text-sm text-emerald-700">
          Your enquiry has been received. Our team will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Full name">
          <Input name="name" placeholder="Your name" required />
        </Field>
        <Field label="Phone">
          <Input name="phone" placeholder="03xx-xxxxxxx" />
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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit Enquiry
          </>
        )}
      </Button>
    </form>
  );
}
