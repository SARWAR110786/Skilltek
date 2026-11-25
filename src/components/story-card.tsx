"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Play, Quote, Star } from "lucide-react";
import { ytThumb } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export type Story = {
  id: string;
  name: string;
  role: string | null;
  quote: string | null;
  youtubeId: string | null;
  featured: boolean;
};

// A student success story: YouTube thumbnail that turns into the player on
// click (the YouTube player only loads when someone wants to watch).
export function StoryCard({ story, className }: { story: Story; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const { youtubeId: vid } = story;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-brand-400/40",
        className,
      )}
    >
      {vid && (
        <div className="relative aspect-[2/3] bg-black">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`}
              title={`${story.name} — SkillTek student story`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${story.name}'s story`}
              className="group absolute inset-0"
            >
              <img
                src={ytThumb(vid)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03] group-hover:opacity-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent" />
              <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-600/40 transition group-hover:scale-110">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
            </button>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        {story.quote && (
          <p className="relative flex-1 text-sm leading-relaxed text-slate-300">
            {!vid && <Quote className="mb-2 h-6 w-6 text-brand-400" />}
            {story.quote}
          </p>
        )}
        <div className={cn("border-l-2 border-brand-500 pl-3", story.quote && "mt-4")}>
          <p className="flex items-center gap-1.5 font-semibold text-white">
            {story.name}
            {story.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          </p>
          {story.role && <p className="truncate text-xs text-brand-300">{story.role}</p>}
        </div>
      </div>
    </article>
  );
}
