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

  if (!name || (!email && !phone)) {
    return { error: "Please provide your name and a contact (email or phone)." };
  }

  const normalizedPhone = phone ? normalizePhone(phone) : null;
  if (phone && !normalizedPhone) {
    return { error: "Please enter a valid phone number." };
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
        courseId: courseId || null,
        service: serviceValue || null,
        message: message || null,
      },
    });
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again later." };
  }
}
