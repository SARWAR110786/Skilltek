"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Badge, Button, Card, CardHeader, Field, Input, Select, Table } from "@/components/ui";
import { saveAttendance } from "@/lib/attendance-actions";

type Row = {
  id: string;
  name: string;
  email: string;
  admissionNo: string;
};

type StatusValue = "PRESENT" | "ABSENT" | "";

const toggleBase =
  "h-9 w-9 cursor-pointer rounded-lg text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={
        "transition hover:shadow-md hover:ring-2 hover:ring-brand-200 " +
        (pending ? "bg-brand-500 text-white" : "")
      }
    >
      {pending ? "Saving…" : "Save attendance"}
    </Button>
  );
}

export function AttendanceTable({
  courses,
  courseId,
  dateValue,
  students,
  statusMap,
  basePath,
  justSaved = false,
}: {
  courses: { id: string; title: string }[];
  courseId: string;
  dateValue: string;
  students: Row[];
  statusMap: Record<string, string>;
  basePath: string;
  justSaved?: boolean;
}) {
  const [statuses, setStatuses] = useState<Record<string, StatusValue>>(() => {
    const initial: Record<string, StatusValue> = {};
    for (const s of students) {
      const v = statusMap[s.id];
      initial[s.id] = v === "PRESENT" || v === "ABSENT" ? v : "";
    }
    return initial;
  });

  const present = students.filter((s) => statuses[s.id] === "PRESENT").length;
  const absent = students.filter((s) => statuses[s.id] === "ABSENT").length;
  const unmarked = students.length - present - absent;
  const back = `${basePath}?course=${courseId}&date=${dateValue}`;

  function toggle(id: string, next: StatusValue) {
    setStatuses((prev) => ({ ...prev, [id]: prev[id] === next ? "" : next }));
  }

  function markAll(next: "PRESENT" | "ABSENT") {
    const updated: Record<string, StatusValue> = {};
    for (const s of students) updated[s.id] = next;
    setStatuses(updated);
  }

  return (
    <div className="space-y-6">
      {justSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M21.8 10A10 10 0 1 1 17 3.3" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          Attendance saved successfully.
        </div>
      )}
      <Card>
        <CardHeader title="Select course & date" />
        <form method="get" action={basePath} className="grid gap-4 p-5 md:grid-cols-3">
          <Field label="Course">
            <Select name="course" defaultValue={courseId}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" name="date" defaultValue={dateValue} />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Load</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Present</p><p className="mt-1 text-2xl font-bold text-emerald-600">{present}</p></div></Card>
        <Card><div className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Absent</p><p className="mt-1 text-2xl font-bold text-rose-600">{absent}</p></div></Card>
        <Card><div className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Not marked</p><p className="mt-1 text-2xl font-bold text-slate-500">{unmarked}</p></div></Card>
      </div>

      <Card>
        <CardHeader
          title="Mark attendance"
          subtitle="Choose Present or Absent for each student, then save once"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => markAll("PRESENT")}
                disabled={students.length === 0}
              >
                Mark all present
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => markAll("ABSENT")}
                disabled={students.length === 0}
              >
                Mark all absent
              </Button>
            </div>
          }
        />
        <form action={saveAttendance}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="date" value={dateValue} />
          <input type="hidden" name="back" value={back} />
          <Table head={["Student", "Roll No", "Status", "Mark Present / Absent"]}>
            {students.map((s) => {
              const status = statuses[s.id];
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.admissionNo}</td>
                  <td className="px-4 py-3">
                    {status === "PRESENT" ? (
                      <Badge tone="green">Present</Badge>
                    ) : status === "ABSENT" ? (
                      <Badge tone="red">Absent</Badge>
                    ) : (
                      <Badge tone="gray">Not marked</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Mark present"
                        aria-pressed={status === "PRESENT"}
                        onClick={() => toggle(s.id, "PRESENT")}
                        className={
                          toggleBase +
                          " focus-visible:ring-emerald-300 " +
                          (status === "PRESENT"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700")
                        }
                      >
                        P
                      </button>
                      <button
                        type="button"
                        aria-label="Mark absent"
                        aria-pressed={status === "ABSENT"}
                        onClick={() => toggle(s.id, "ABSENT")}
                        className={
                          toggleBase +
                          " focus-visible:ring-rose-300 " +
                          (status === "ABSENT"
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "border border-slate-200 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700")
                        }
                      >
                        A
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No students in this course.
                </td>
              </tr>
            )}
          </Table>
          {students.map((s) => (
            <input
              key={s.id}
              type="hidden"
              name={`status_${s.id}`}
              value={statuses[s.id]}
            />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              {present + absent} of {students.length} marked
            </p>
            <SaveButton disabled={students.length === 0} />
          </div>
        </form>
      </Card>
    </div>
  );
}
