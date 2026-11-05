"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui";

export function StudentsAutoSearch({
  defaultValue,
  courseFilter,
}: {
  defaultValue: string;
  courseFilter?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function scheduleSearch(nextValue: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const trimmed = nextValue.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      if (courseFilter) {
        params.set("course", courseFilter);
      } else {
        params.delete("course");
      }

      const query = params.toString();
      const y = window.scrollY;
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      });
    }, 200);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setValue(nextValue);
    scheduleSearch(nextValue);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      const y = window.scrollY;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const trimmed = value.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      if (courseFilter) {
        params.set("course", courseFilter);
      } else {
        params.delete("course");
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      });
    }
  }

  return (
    <div ref={searchRef} className="relative">
      <Input
        value={value}
        placeholder="Search students..."
        className="w-72"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-label="Search students"
      />
      {isPending && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ...
        </span>
      )}
    </div>
  );
}
