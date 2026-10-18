import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { ArrowRight, Camera, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "Gallery · SkillTek" };
export const instant = false;

async function getAlbums() {
  try {
    await connection();
    return await prisma.galleryAlbum.findMany({
      where: { published: true },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: {
        images: { orderBy: { order: "asc" }, take: 1, select: { id: true } },
        _count: { select: { images: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const albums = await getAlbums();

  return (
    <div>
      <PageHero
        eyebrow="Gallery"
        title="Life at SkillTek"
        subtitle="Moments from our events, classrooms, workshops and student achievements."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        {albums.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-500">
            No albums published yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => {
              const cover = a.images[0]?.id;
              return (
                <Reveal key={a.id} delay={i * 80} className="h-full">
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                      {cover ? (
                        <Image
                          src={`/api/gallery/${cover}`}
                          alt={a.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-600">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}
                      {a.year && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                          <Calendar className="h-3 w-3" /> {a.year}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                      {a.description && (
                        <p className="mt-1 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400">
                          {a.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Camera className="h-3.5 w-3.5" />
                          {a._count.images} photo{a._count.images === 1 ? "" : "s"}
                        </span>
                        <Link
                          href={`/gallery/${a.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
                        >
                          Read more <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
