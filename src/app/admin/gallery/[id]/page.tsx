import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { addImages, deleteAlbum, deleteImage, updateAlbum } from "../actions";

export const instant = false;

async function getAlbum(id: string) {
  await connection();
  return prisma.galleryAlbum.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
}

export default async function AdminAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    added?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;
  const sp = await searchParams;
  const album = await getAlbum(id);

  if (!album) notFound();

  return (
    <div>
      <Link
        href="/admin/gallery"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to gallery
      </Link>
      <PageHeader
        title={album.title}
        subtitle={`${album.images.length} photo${album.images.length === 1 ? "" : "s"}${album.year ? ` · ${album.year}` : ""}`}
        action={
          <form action={deleteAlbum}>
            <input type="hidden" name="id" value={album.id} />
            <Button type="submit" variant="danger">
              <Trash2 className="h-4 w-4" /> Delete Album
            </Button>
          </form>
        }
      />

      {sp.updated && <Alert tone="success">Album updated.</Alert>}
      {sp.added && <Alert tone="success">Photos added.</Alert>}
      {sp.error === "required" && <Alert tone="error">A title is required.</Alert>}
      {sp.error === "nofiles" && (
        <Alert tone="error">Please choose at least one image file.</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Album Details" />
          <form action={updateAlbum} className="grid gap-4 p-5">
            <input type="hidden" name="id" value={album.id} />
            <Field label="Title">
              <Input name="title" defaultValue={album.title} required />
            </Field>
            <Field label="Year">
              <Input
                name="year"
                type="number"
                min={1900}
                max={2199}
                defaultValue={album.year ?? ""}
              />
            </Field>
            <Field label="Description">
              <Textarea name="description" rows={5} defaultValue={album.description ?? ""} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="published"
                defaultChecked={album.published}
                className="h-4 w-4 rounded"
              />{" "}
              Published
            </label>
            <Button type="submit">Save Changes</Button>
          </form>

          <div className="border-t border-slate-100 p-5">
            <form action={addImages} className="grid gap-4">
              <input type="hidden" name="id" value={album.id} />
              <Field label="Add photos" hint="JPG, PNG or WebP · up to 8 MB each">
                <Input name="images" type="file" accept="image/*" multiple />
              </Field>
              <Button type="submit" variant="secondary">
                <ImagePlus className="h-4 w-4" /> Upload Photos
              </Button>
            </form>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Photos" subtitle={`${album.images.length} in this album`} />
          {album.images.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm text-slate-400">
              No photos yet. Upload some using the form.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              {album.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                >
                  <Image
                    src={`/api/gallery/${img.id}`}
                    alt={img.caption ?? album.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 240px"
                    className="object-cover"
                  />
                  <form
                    action={deleteImage}
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <input type="hidden" name="id" value={img.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-white/90 p-2 text-rose-600 shadow-sm hover:bg-white"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
