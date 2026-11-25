"use server";

import { guard } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { youtubeId } from "@/lib/youtube";

function refresh() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
  revalidatePath("/");
}

async function createTestimonial__impl(formData: FormData) {
  await requireUser("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() || null;
  const quote = String(formData.get("quote") ?? "").trim() || null;
  const link = String(formData.get("youtube") ?? "").trim();
  const featured = formData.get("featured") === "on";
  const published = formData.get("publish") === "on";

  if (!name) redirect("/admin/testimonials?error=name");
  const vid = link ? youtubeId(link) : null;
  if (link && !vid) redirect("/admin/testimonials?error=link");
  if (!vid && !quote) redirect("/admin/testimonials?error=empty");
  if (name.length > 80 || (role?.length ?? 0) > 120 || (quote?.length ?? 0) > 1000)
    redirect("/admin/testimonials?error=long");

  await prisma.testimonial.create({
    data: { name, role, quote, youtubeId: vid, featured, published },
  });
  refresh();
  redirect(`/admin/testimonials?created=${published ? "published" : "draft"}`);
}

async function setPublished__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "1";
  if (id) await prisma.testimonial.updateMany({ where: { id }, data: { published } });
  refresh();
  redirect(`/admin/testimonials?${published ? "published=1" : "hidden=1"}`);
}

async function setFeatured__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "1";
  if (id) await prisma.testimonial.updateMany({ where: { id }, data: { featured } });
  refresh();
  redirect("/admin/testimonials");
}

async function deleteTestimonial__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.testimonial.deleteMany({ where: { id } });
  refresh();
  redirect("/admin/testimonials?deleted=1");
}

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createTestimonial(...args: Parameters<typeof createTestimonial__impl>) {
  return guard(() => createTestimonial__impl(...args));
}
export async function setPublished(...args: Parameters<typeof setPublished__impl>) {
  return guard(() => setPublished__impl(...args));
}
export async function setFeatured(...args: Parameters<typeof setFeatured__impl>) {
  return guard(() => setFeatured__impl(...args));
}
export async function deleteTestimonial(...args: Parameters<typeof deleteTestimonial__impl>) {
  return guard(() => deleteTestimonial__impl(...args));
}
