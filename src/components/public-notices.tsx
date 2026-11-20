import Link from "next/link";
import { ArrowRight, Megaphone, Pin } from "lucide-react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export type PublicNotice = { id: string; title: string; body: string; pinned: boolean; createdAt: Date };

/** Notices for "Everyone" are public: shown on the website too. */
export async function getPublicNotices(take?: number): Promise<PublicNotice[]> {
  // Outside the try: during prerendering this signals "render at request time".
  await connection();
  try {
    return await prisma.notice.findMany({
      where: { target: "ALL" },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take,
      select: { id: true, title: true, body: true, pinned: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

function NoticeCard({ n, clamp }: { n: PublicNotice; clamp: boolean }) {
  return (
    <article
      id={`notice-${n.id}`}
      className={`scroll-mt-28 rounded-2xl border bg-white/[0.03] p-5 transition-colors sm:p-6 ${
        n.pinned ? "border-amber-400/40" : "border-white/10 hover:border-brand-500/40"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {n.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-300">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
        <time className="text-slate-500" dateTime={n.createdAt.toISOString()}>
          {formatDate(n.createdAt)}
        </time>
      </div>
      <h3 className="mt-2 break-words text-base font-semibold text-white">{n.title}</h3>
      <p
        className={`mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-400 ${
          clamp ? "line-clamp-4" : ""
        }`}
      >
        {n.body}
      </p>
      {clamp && (
        <Link
          href={`/notices#notice-${n.id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
        >
          Read more <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </article>
  );
}

/** Home page "Announcements" block (latest few). Hidden when there are none. */
export function NoticesSection({ notices }: { notices: PublicNotice[] }) {
  if (notices.length === 0) return null;
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-400">
              <Megaphone className="h-4 w-4" /> Announcements
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Latest notices</h2>
          </div>
          <Link
            href="/notices"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
          >
            View all notices <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((n) => (
            <NoticeCard key={n.id} n={n} clamp />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Full list for the /notices page. */
export function NoticesList({ notices }: { notices: PublicNotice[] }) {
  if (notices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-500">
        No notices right now. Please check back soon.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {notices.map((n) => (
        <NoticeCard key={n.id} n={n} clamp={false} />
      ))}
    </div>
  );
}
