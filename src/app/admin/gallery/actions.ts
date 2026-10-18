"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function revalidate(id?: string) {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  if (id) revalidatePath(`/gallery/${id}`);
  revalidatePath("/");
}

function readYear(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 1900 && n < 2200 ? Math.floor(n) : null;
}

async function readImages(formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const images = await Promise.all(
    files
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_BYTES)
      .map(async (f) => ({
        fileName: f.name,
        mimeType: f.type || "image/jpeg",
        size: f.size,
        data: Buffer.from(await f.arrayBuffer()),
      })),
  );
  return images;
}

export async function createAlbum(formData: FormData) {
  await requireUser("ADMIN");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/gallery?error=required");

  const description = String(formData.get("description") ?? "").trim();
  const year = readYear(formData.get("year"));
  const published = formData.get("published") !== null;
  const images = await readImages(formData);

  const album = await prisma.galleryAlbum.create({
    data: {
      title,
      description: description || null,
      year,
      published,
      images: images.length
        ? { create: images.map((img, i) => ({ ...img, order: i })) }
        : undefined,
    },
  });

  revalidate(album.id);
  redirect(`/admin/gallery/${album.id}?created=1`);
}

export async function updateAlbum(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect(`/admin/gallery/${id}?error=required`);

  await prisma.galleryAlbum.update({
    where: { id },
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      year: readYear(formData.get("year")),
      published: formData.get("published") === "on",
    },
  });

  revalidate(id);
  redirect(`/admin/gallery/${id}?updated=1`);
}

async function nextImageOrder(albumId: string) {
  const last = await prisma.galleryImage.findFirst({
    where: { albumId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export async function addImages(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const images = await readImages(formData);
  if (images.length === 0) redirect(`/admin/gallery/${id}?error=nofiles`);

  const start = await nextImageOrder(id);
  await prisma.galleryImage.createMany({
    data: images.map((img, i) => ({ ...img, albumId: id, order: start + i })),
  });
  revalidate(id);
  redirect(`/admin/gallery/${id}?added=1`);
}

export async function deleteImage(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) return;
  await prisma.galleryImage.delete({ where: { id } });
  revalidate(image.albumId);
}

export async function deleteAlbum(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.galleryAlbum.delete({ where: { id } });
  revalidate();
  redirect("/admin/gallery?deleted=1");
}
