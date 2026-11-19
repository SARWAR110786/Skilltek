import { Fragment, type ReactNode } from "react";

/*
 * Course descriptions are typed by admins and may use simple Markdown
 * (# headings, **bold**, *italic*, - lists, 1. lists). These helpers show it
 * properly. They build React elements only — never raw HTML — so nothing
 * typed in a description can inject markup or scripts.
 */

/** Plain text for short previews: Markdown signs removed, lines joined. */
export function plainText(md: string): string {
  return md
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s+/, "")
        .replace(/^([-*+]|\d+[.)])\s+/, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1$2")
        .replace(/`([^`]+)`/g, "$1"),
    )
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** **bold**, __bold__ and *italic* inside one line. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|__(.+?)__|\*(?!\s)(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] ?? m[2]) out.push(<strong key={k++} className="font-semibold text-white">{m[1] ?? m[2]}</strong>);
    else out.push(<em key={k++}>{m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

/** Renders a description with headings, paragraphs and lists. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    if (!line) {
      blocks.push({ kind: "p", lines: [] }); // paragraph break
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    const ul = /^[-*+]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (h) blocks.push({ kind: "h", text: h[1] });
    else if (ul) {
      if (last?.kind === "ul") last.items.push(ul[1]);
      else blocks.push({ kind: "ul", items: [ul[1]] });
    } else if (ol) {
      if (last?.kind === "ol") last.items.push(ol[1]);
      else blocks.push({ kind: "ol", items: [ol[1]] });
    } else if (last?.kind === "p") last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === "h")
          return (
            <h4 key={i} className="mb-2 mt-5 text-base font-semibold text-white first:mt-0">
              {inline(b.text)}
            </h4>
          );
        if (b.kind === "ul" || b.kind === "ol") {
          const List = b.kind === "ul" ? "ul" : "ol";
          return (
            <List
              key={i}
              className={`mb-3 space-y-1 pl-5 ${b.kind === "ul" ? "list-disc" : "list-decimal"} marker:text-brand-400`}
            >
              {b.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </List>
          );
        }
        if (b.kind !== "p" || b.lines.length === 0) return null;
        return (
          <p key={i} className="mb-3 last:mb-0">
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
