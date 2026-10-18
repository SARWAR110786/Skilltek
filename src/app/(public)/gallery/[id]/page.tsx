import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { GalleryViewer } from "@/components/gallery-viewer";

async function getAlbum(id: string) {
  await connection();
  return prisma.galleryAlbum.findFirst({
    where: { id, published: true },
    include: { images: { orderBy: { order: "asc" } } },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  return { title: album ? `${album.title} · SkillTek` : "Gallery · SkillTek" };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <div>
      <PageHero
        eyebrow={album.year ? `Gallery · ${album.year}` : "Gallery"}
        title={album.title}
        subtitle={album.description ?? "A collection of photos from SkillTek Institute."}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <Link
          href="/gallery"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-brand-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to gallery
        </Link>

        {album.images.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-500">
            No photos in this album yet.
          </p>
        ) : (
          <GalleryViewer
            albumTitle={album.title}
            photos={album.images.map((img) => ({
              id: img.id,
              caption: img.caption,
            }))}
          />
        )}
      </section>
    </div>
  );
}
