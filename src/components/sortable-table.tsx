"use client";

import { Children, isValidElement, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The portal's shared table. Click a column heading to sort its rows
 * ascending, click again for descending, a third time for the original order.
 *
 * Rows come from server components as React elements, so the value of a cell
 * is read from its text. A cell may set `data-sort-value` to sort by something
 * other than what it shows. Rows that must stay at the bottom (totals) set
 * `data-pin="bottom"`; an "empty" row (one cell spanning the table) stays too.
 */

type Dir = "asc" | "desc";

const NOT_SORTABLE = new Set(["", "actions", "action"]);

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    if (props["data-sort-value"] != null) return String(props["data-sort-value"]);
    // Inputs on a sheet (e.g. marks) sort by what they hold.
    if (node.type === "input" && props.defaultValue != null) return String(props.defaultValue);
    return textOf(props.children as ReactNode);
  }
  return ""; // lazy or unknown nodes: nothing to read
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** "05 Nov 2026" or "05 Nov 2026, 14:30" → timestamp. */
function asDate(t: string): number | null {
  const m = /^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})(?:,? (\d{1,2}):(\d{2}))?/.exec(t);
  if (!m || !(m[2].toLowerCase() in MONTHS)) return null;
  return Date.UTC(+m[3], MONTHS[m[2].toLowerCase()], +m[1], +(m[4] ?? 0), +(m[5] ?? 0));
}

/** "Rs 25,000", "83.5", "12 / 15", "45%", "#3" → the leading number. */
function asNumber(t: string): number | null {
  const m = /^(?:Rs\.?\s*|\$|#)?(-?[\d,]*\.?\d+)/.exec(t);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function headingText(h: ReactNode): string {
  return textOf(h).trim();
}

function isPinned(row: ReactNode): boolean {
  if (!isValidElement(row)) return true;
  const props = row.props as Record<string, unknown>;
  if (props["data-pin"] === "bottom") return true;
  const cells = Children.toArray(props.children as ReactNode).filter(isValidElement);
  if (cells.length === 1) {
    const span = Number((cells[0].props as Record<string, unknown>).colSpan ?? 1);
    return span > 1; // "No records yet" row
  }
  return false;
}

function cellText(row: ReactNode, col: number): string {
  if (!isValidElement(row)) return "";
  const cells = Children.toArray((row.props as { children?: ReactNode }).children).filter(isValidElement);
  return textOf(cells[col] as ReactNode).replace(/\s+/g, " ").trim();
}

export function SortableTable({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  const [sort, setSort] = useState<{ col: number; dir: Dir } | null>(null);

  const rows = useMemo(() => {
    const all = Children.toArray(children);
    if (!sort) return all;
    const body = all.filter((r) => !isPinned(r));
    const pinned = all.filter(isPinned);

    const values = body.map((r) => {
      const t = cellText(r, sort.col);
      return { r, t, d: asDate(t), n: asNumber(t) };
    });
    const filled = values.filter((v) => v.t && v.t !== "—" && v.t !== "-");
    const most = (k: "d" | "n") => filled.length > 0 && filled.filter((v) => v[k] != null).length >= filled.length * 0.8;
    const kind: "d" | "n" | "s" = most("d") ? "d" : most("n") ? "n" : "s";

    const sign = sort.dir === "asc" ? 1 : -1;
    const sorted = values
      .map((v, i) => ({ ...v, i }))
      .sort((a, b) => {
        const ea = !a.t || a.t === "—" || a.t === "-";
        const eb = !b.t || b.t === "—" || b.t === "-";
        if (ea !== eb) return ea ? 1 : -1; // empty cells always last
        let c = 0;
        if (kind === "d") c = (a.d ?? Infinity) - (b.d ?? Infinity);
        else if (kind === "n") c = (a.n ?? Infinity) - (b.n ?? Infinity);
        else c = a.t.localeCompare(b.t, undefined, { numeric: true, sensitivity: "base" });
        return c * sign || a.i - b.i;
      });
    return [...sorted.map((v) => v.r), ...pinned];
  }, [children, sort]);

  function toggle(col: number) {
    setSort((s) =>
      !s || s.col !== col ? { col, dir: "asc" } : s.dir === "asc" ? { col, dir: "desc" } : null,
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {head.map((h, i) => {
              const label = headingText(h);
              const sortable = !NOT_SORTABLE.has(label.toLowerCase());
              const active = sort?.col === i;
              return (
                <th
                  key={i}
                  className="px-4 py-3 font-medium"
                  aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      title="Sort ascending / descending"
                      className={cn(
                        "group inline-flex cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors hover:text-slate-800",
                        active && "text-brand-700",
                      )}
                    >
                      {h}
                      {active ? (
                        sort?.dir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-70" />
                      )}
                    </button>
                  ) : (
                    h
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{rows}</tbody>
      </table>
    </div>
  );
}
