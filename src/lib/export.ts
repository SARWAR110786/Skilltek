import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSession, type SessionUser } from "@/lib/auth";

export type Cell = string | number | null | undefined;

export async function getExportAuth(): Promise<SessionUser | null> {
  const user = await getSession();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "TEACHER") return null;
  return user;
}

function escapeCell(value: Cell): string {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvString(rows: Cell[][]): string {
  return (
    "\uFEFF" +
    rows.map((row) => row.map(escapeCell).join(",")).join("\r\n") +
    "\r\n"
  );
}

export function csvResponse(filename: string, rows: Cell[][]): Response {
  return new Response(csvString(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function pdfResponse(
  filename: string,
  opts: {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: Cell[][];
  },
): Promise<Response> {
  const { title, subtitle, headers, rows } = opts;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PW = 595.28;
  const PH = 841.89;
  const margin = 36;
  const usable = PW - margin * 2;
  const cols = Math.max(headers.length, 1);
  const colW = usable / cols;
  const rowH = 18;
  const fontSize = 9;

  const colorText = rgb(0.2, 0.25, 0.31);
  const colorHead = rgb(0.12, 0.16, 0.22);
  const colorHeadBg = rgb(0.94, 0.96, 1);
  const colorLine = rgb(0.85, 0.88, 0.92);

  const truncate = (text: string, max: number) => {
    if (font.widthOfTextAtSize(text, fontSize) <= max) return text;
    let t = text;
    while (t.length && font.widthOfTextAtSize(t + "…", fontSize) > max) {
      t = t.slice(0, -1);
    }
    return t + "…";
  };

  let page = doc.addPage([PW, PH]);
  let y = PH - margin;

  page.drawText(title, { x: margin, y, size: 16, font: bold, color: colorHead });
  y -= 18;
  if (subtitle) {
    page.drawText(subtitle, { x: margin, y, size: 10, font, color: colorText });
    y -= 14;
  }
  page.drawText(
    `Generated ${new Date().toLocaleString("en-GB")}`,
    { x: margin, y, size: 8, font, color: colorText },
  );
  y -= 20;

  const drawHeaderRow = () => {
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: usable,
      height: rowH,
      color: colorHeadBg,
    });
    headers.forEach((h, i) => {
      page.drawText(truncate(h, colW - 8), {
        x: margin + i * colW + 4,
        y: y + 1,
        size: fontSize,
        font: bold,
        color: colorHead,
      });
    });
    y -= rowH;
    page.drawLine({
      start: { x: margin, y: y + 3 },
      end: { x: PW - margin, y: y + 3 },
      thickness: 0.5,
      color: colorLine,
    });
  };

  drawHeaderRow();

  for (const row of rows) {
    if (y < margin + rowH) {
      page = doc.addPage([PW, PH]);
      y = PH - margin;
      drawHeaderRow();
    }
    row.forEach((cell, i) => {
      const text = truncate(cell == null ? "" : String(cell), colW - 8);
      page.drawText(text, {
        x: margin + i * colW + 4,
        y: y + 1,
        size: fontSize,
        font,
        color: colorText,
      });
    });
    y -= rowH;
  }

  const bytes = await doc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
