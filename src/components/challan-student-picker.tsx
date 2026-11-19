"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

export type PickerStudent = {
  id: string;
  name: string;
  admissionNo: string;
  courseId: string | null;
};

export type PickerCourse = { id: string; title: string };

const NO_COURSE = "__none__";

/**
 * Step 1: pick a course. Step 2: tick the enrolled students (or "Select all").
 * Every ticked student is submitted as a hidden `studentIds` field, so one
 * submit creates a challan for each of them.
 */
export function ChallanStudentPicker({
  students,
  courses,
}: {
  students: PickerStudent[];
  courses: PickerCourse[];
}) {
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of students) {
      const k = s.courseId ?? NO_COURSE;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [students]);

  const inCourse = useMemo(
    () =>
      courseId
        ? students.filter((s) => (s.courseId ?? NO_COURSE) === courseId)
        : [],
    [students, courseId],
  );

  const q = search.trim().toLowerCase();
  const visible = q
    ? inCourse.filter(
        (s) => s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q),
      )
    : inCourse;

  const allVisibleChecked = visible.length > 0 && visible.every((s) => checked.has(s.id));

  function chooseCourse(id: string) {
    setCourseId(id);
    setSearch("");
    // Select every enrolled student by default; untick the ones to skip.
    setChecked(
      new Set(students.filter((s) => (s.courseId ?? NO_COURSE) === id).map((s) => s.id)),
    );
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const s of visible) {
        if (allVisibleChecked) next.delete(s.id);
        else next.add(s.id);
      }
      return next;
    });
  }

  const hasNoCourse = (counts.get(NO_COURSE) ?? 0) > 0;

  return (
    <div className="space-y-3">
      <Select value={courseId} onChange={(e) => chooseCourse(e.target.value)} required>
        <option value="">Select course</option>
        {courses
          .filter((c) => counts.get(c.id))
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({counts.get(c.id)} student{counts.get(c.id) === 1 ? "" : "s"})
            </option>
          ))}
        {hasNoCourse && (
          <option value={NO_COURSE}>No course assigned ({counts.get(NO_COURSE)})</option>
        )}
      </Select>

      {courseId && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={allVisibleChecked}
                onChange={toggleAll}
                disabled={visible.length === 0}
              />
              Select all{q ? " (shown)" : ""}
            </label>
            <span className="text-xs text-slate-500">
              {checked.size} of {inCourse.length} selected
            </span>
            <div className="ml-auto w-full sm:w-56">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or roll no"
                className="py-1.5 text-xs"
              />
            </div>
          </div>
          <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {visible.map((s) => (
              <li key={s.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50",
                    checked.has(s.id) && "bg-brand-50/50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={checked.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.admissionNo}</span>
                </label>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-400">
                No students match your search.
              </li>
            )}
          </ul>
        </div>
      )}

      {Array.from(checked).map((id) => (
        <input key={id} type="hidden" name="studentIds" value={id} />
      ))}
      {courseId && checked.size === 0 && (
        <p className="text-xs text-rose-600">Tick at least one student.</p>
      )}
    </div>
  );
}
