"use client";

import { useEffect, useState } from "react";

type Phase = "holding" | "typing" | "deleting";

export function Typewriter({
  prefix,
  accent,
  accentClassName,
  className,
  typingSpeed = 75,
  deletingSpeed = 40,
  holdMs = 1500,
}: {
  prefix: string;
  accent: string;
  accentClassName?: string;
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  holdMs?: number;
}) {
  const full = prefix + accent;
  const [count, setCount] = useState(full.length);
  const [phase, setPhase] = useState<Phase>("holding");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) {
      setCount(full.length);
      return;
    }

    let timer: number;
    if (phase === "holding") {
      timer = window.setTimeout(() => setPhase("deleting"), holdMs);
    } else if (phase === "typing") {
      timer =
        count < full.length
          ? window.setTimeout(() => setCount((c) => c + 1), typingSpeed)
          : window.setTimeout(() => setPhase("deleting"), holdMs);
    } else {
      timer =
        count > 0
          ? window.setTimeout(() => setCount((c) => c - 1), deletingSpeed)
          : window.setTimeout(() => setPhase("typing"), typingSpeed);
    }
    return () => window.clearTimeout(timer);
  }, [phase, count, reduced, full.length, typingSpeed, deletingSpeed, holdMs]);

  const visible = full.slice(0, count);
  const white = visible.slice(0, Math.min(count, prefix.length));
  const accentVisible = count > prefix.length ? visible.slice(prefix.length) : "";

  return (
    <span aria-label={full} className={className}>
      <span aria-hidden="true">{white}</span>
      {accentVisible ? (
        <span aria-hidden="true" className={accentClassName}>
          {accentVisible}
        </span>
      ) : null}
      {!reduced ? (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1em] w-[3px] translate-y-[0.12em] rounded-sm bg-brand-300 caret-blink"
        />
      ) : null}
    </span>
  );
}
