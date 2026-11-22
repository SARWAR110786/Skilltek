"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/validation";

export type EnquiryState = { ok?: boolean; error?: string };

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const serviceOther = String(formData.get("serviceOther") ?? "").trim();
  const serviceValue = service === "Other" ? serviceOther || "Other" : service;
  const message = String(formData.get("message") ?? "").trim();

  if (
    name.length > 120 ||
    email.length > 254 ||
    phone.length > 30 ||
    serviceValue.length > 120 ||
    message.length > 3000 ||
    courseId.length > 64
  ) {
    return { error: "Some fields are too long. Please shorten them and try again." };
  }
  // Everything is required except the message.
  if (!name) return { error: "Please enter your full name." };
  if (!phone) return { error: "Please enter your phone number." };
  // Digits only, 11 of them (e.g. 03001234567).
  const normalizedPhone = /^\d{11}$/.test(phone) ? normalizePhone(phone) : null;
  if (!normalizedPhone) {
    return { error: "Please enter an 11-digit phone number using numbers only, e.g. 03001234567." };
  }
  if (!email) return { error: "Please enter your email address." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (service === "Other" && !serviceOther) {
    return { error: "Please tell us which service you need." };
  }
  // Admission form: a program must be chosen (when any are open).
  // Services form: a service must be chosen.
  if (!serviceValue && !courseId) {
    const anyOpen = await prisma.course.count({ where: { active: true } });
    if (anyOpen > 0) return { error: "Please select the course you want to apply for." };
  }

  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    store.get("x-real-ip") ||
    "unknown";
  const limit = rateLimit(`enquiry:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return {
      error: `Too many submissions. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }

  try {
    await prisma.enquiry.create({
      data: {
        name,
        email: email || null,
        phone: normalizedPhone,
        // Ignore unknown/inactive course ids instead of failing on the FK.
        courseId:
          courseId &&
          (await prisma.course.findFirst({ where: { id: courseId, active: true }, select: { id: true } }))
            ? courseId
            : null,
        service: serviceValue || null,
        message: message || null,
      },
    });
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again later." };
  }
}
