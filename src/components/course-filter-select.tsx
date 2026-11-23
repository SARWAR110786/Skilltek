"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui";

/** Course dropdown that filters the current list as soon as it changes. */
export function CourseFilterSelect({
  courses,
  value,
}: {
  courses: { id: string; title: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("course", next);
    else params.delete("course");
    params.delete("edit");
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  return (
    <Select
      aria-label="Filter by course"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`!w-auto max-w-[16rem] !py-2 text-sm ${isPending ? "opacity-60" : ""}`}
    >
      <option value="">All courses</option>
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </Select>
  );
}
