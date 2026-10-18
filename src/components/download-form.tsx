"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";

export type DownloadField =
  | { kind: "hidden"; name: string; value: string }
  | {
      kind: "select";
      name: string;
      label: string;
      defaultValue?: string;
      options: { value: string; label: string }[];
    }
  | { kind: "date"; name: string; label: string; defaultValue?: string }
  | { kind: "month"; name: string; label: string; defaultValue?: string };

export function DownloadForm({
  action,
  fields,
  label = "Download",
}: {
  action: string;
  fields: DownloadField[];
  label?: string;
}) {
  const rangeField = fields.find((f) => f.kind === "select" && f.name === "range");
  const hasDate = fields.some((f) => f.kind === "date");
  const hasMonth = fields.some((f) => f.kind === "month");
  const toggleRange = rangeField && hasDate && hasMonth;
  const [range, setRange] = useState(
    rangeField && rangeField.kind === "select" ? rangeField.defaultValue ?? "day" : "day",
  );

  return (
    <form
      method="get"
      action={action}
      className="flex flex-wrap items-end gap-3"
    >
      {fields.map((f) => {
        if (f.kind === "hidden") {
          return <input key={f.name} type="hidden" name={f.name} value={f.value} />;
        }
        if (f.kind === "select") {
          return (
            <div key={f.name} className="min-w-[10rem]">
              <Field label={f.label}>
                <Select
                  name={f.name}
                  defaultValue={f.defaultValue}
                  onChange={f.name === "range" ? (e) => setRange(e.target.value) : undefined}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          );
        }
        if (toggleRange) {
          if (f.kind === "date" && range !== "day") return null;
          if (f.kind === "month" && range !== "month") return null;
        }
        return (
          <div key={f.name} className="min-w-[9rem]">
            <Field label={f.label}>
              <Input type={f.kind} name={f.name} defaultValue={f.defaultValue} />
            </Field>
          </div>
        );
      })}
      <Field label="File type">
        <Select name="format" defaultValue="csv" className="w-32">
          <option value="csv">CSV (.csv)</option>
          <option value="pdf">PDF (.pdf)</option>
        </Select>
      </Field>
      <Button type="submit">{label}</Button>
    </form>
  );
}
