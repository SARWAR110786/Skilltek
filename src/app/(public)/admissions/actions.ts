"use server";

import { prisma } from "@/lib/prisma";

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

  try {
    await prisma.enquiry.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
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
