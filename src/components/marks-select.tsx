import { cn } from "@/lib/utils";

export function MarksSelect({
  name = "marksObtained",
  max,
  defaultValue,
  className,
  required,
}: {
  name?: string;
  max: number;
  defaultValue?: number | null;
  className?: string;
  required?: boolean;
}) {
  const total = Math.max(1, Math.floor(max));
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      aria-label={`Marks out of ${total}`}
      className={cn(
        "rounded-lg border border-slate-300 bg-white text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        className,
      )}
    >
      <option value="" disabled={required}>
        {required ? "Select marks" : "Not graded"}
      </option>
      {Array.from({ length: total }, (_, i) => i + 1).map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
