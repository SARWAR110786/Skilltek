import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Images, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { createAlbum, deleteAlbum } from "./actions";

export const instant = false;

async function getAlbums() {
  await connection();
  return prisma.galleryAlbum.findMany({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { images: true } } },
  });
}

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const albums = await getAlbums();
  const sp = await searchParams;

  return (
    <div>
      <PageHeader
        title="Gallery"
        subtitle="Create photo albums that appear on the public gallery page"
      />

      {sp.error === "required" && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          A title is required.
        </div>
      )}
      {sp.deleted && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Album deleted.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader title="New Album" />
        <form action={createAlbum} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Title">
            <Input name="title" required placeholder="e.g. Annual Prize Distribution" />
          </Field>
          <Field label="Year">
            <Input
              name="year"
              type="number"
              min={1900}
              max={2199}
              defaultValue={new Date().getFullYear()}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea
                name="description"
                rows={3}
                placeholder="Short summary of the event or collection"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Photos" hint="Select one or more images (JPG, PNG, WebP · up to 8 MB each)">
              <Input name="images" type="file" accept="image/*" multiple />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="published"
              defaultChecked
              className="h-4 w-4 rounded"
            />{" "}
            Published
          </label>
          <div className="flex justify-end">
            <Button type="submit">
              <Images className="h-4 w-4" /> Create Album
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <Card key={a.id} className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-800">{a.title}</h3>
                <p className="text-xs text-slate-400">
                  {a._count.images} photo{a._count.images === 1 ? "" : "s"}
                  {a.year ? ` · ${a.year}` : ""}
                </p>
              </div>
              <Badge tone={a.published ? "green" : "gray"}>
                {a.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="line-clamp-3 flex-1 px-5 py-4 text-sm text-slate-500">
              {a.description ?? "No description."}
            </p>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-3">
              <Link
                href={`/admin/gallery/${a.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
              <form action={deleteAlbum}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete album"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Card>
        ))}
        {albums.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center text-sm text-slate-400">
            No albums yet. Create your first album above.
          </p>
        )}
      </div>
    </div>
  );
}
