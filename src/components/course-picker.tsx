import { ChevronDown } from "lucide-react";

export function CoursePicker({
  courses,
  selected = [],
}: {
  courses: { id: string; title: string }[];
  selected?: string[];
}) {
  if (courses.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No courses yet. Create a course first.
      </p>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200 [&::-webkit-details-marker]:hidden">
        <span>
          {selected.length > 0
            ? `${selected.length} course${selected.length === 1 ? "" : "s"} selected`
            : "Select courses…"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
        {courses.map((course) => (
          <label
            key={course.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-brand-50"
          >
            <input
              type="checkbox"
              name="courseIds"
              value={course.id}
              defaultChecked={selected.includes(course.id)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {course.title}
          </label>
        ))}
      </div>
    </details>
  );
}
