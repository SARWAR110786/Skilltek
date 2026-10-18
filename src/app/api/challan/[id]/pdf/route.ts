import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate, formatCurrency } from "@/lib/utils";
import { amountInWords, feePeriodLabel, challanItems } from "@/lib/challan";

const PW = 595.28;
const PH = 841.89;
const M = 24;
const BAND = (PH - M * 2) / 3;

const C_HEAD = rgb(0.1, 0.14, 0.2);
const C_TEXT = rgb(0.24, 0.29, 0.36);
const C_MUTED = rgb(0.45, 0.5, 0.57);
const C_LINE = rgb(0.75, 0.79, 0.85);
const C_ACCENT = rgb(0.11, 0.35, 0.72);
const C_BG = rgb(0.95, 0.97, 1);
const C_WARN = rgb(0.72, 0.24, 0.24);

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function txt(
  page: any,
  s: string,
  x: number,
  y: number,
  opts: { font: Font; size?: number; color?: any; align?: "left" | "right"; max?: number },
) {
  const { font, size = 8, color = C_TEXT, align = "left", max } = opts;
  let text = s;
  if (max) {
    if (font.widthOfTextAtSize(text, size) > max) {
      while (text.length && font.widthOfTextAtSize(text + "…", size) > max) {
        text = text.slice(0, -1);
      }
      text += "…";
    }
  }
  if (align === "right") {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x - w, y, size, font, color });
    return;
  }
  page.drawText(text, { x, y, size, font, color });
}

function dashed(page: any, y: number, x1: number, x2: number, color = C_LINE) {
  const dash = 5;
  const gap = 4;
  for (let x = x1; x < x2; x += dash + gap) {
    const end = Math.min(x + dash, x2);
    page.drawLine({ start: { x, y }, end: { x: end, y }, thickness: 0.6, color });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const [challan, setting] = await Promise.all([
    prisma.challan.findUnique({
      where: { id },
      include: {
        student: {
          include: { user: true, course: { select: { title: true } } },
        },
      },
    }),
    prisma.setting.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!challan) return new NextResponse("Not found", { status: 404 });

  if (user.role !== "ADMIN") {
    if (user.role === "STUDENT") {
      const sp = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!sp || sp.id !== challan.studentId) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const page = doc.addPage([PW, PH]);

  const overdue = challan.status !== "PAID" && challan.dueDate.getTime() < Date.now();
  const items = challanItems(challan);
  const afterDue = challan.amount + challan.lateFee;
  const balance = Math.max(0, afterDue - challan.paidAmount);

  const inst = setting?.instituteName ?? "SkillTek";
  const tagline = setting?.tagline ?? "";
  const address = setting?.address ?? "";
  const phone = setting?.phone ?? "";
  const email = setting?.email ?? "";
  const currency = setting?.currency ?? "PKR";

  const bank = {
    name: setting?.bankName ?? "",
    branch: setting?.bankBranch ?? "",
    title: setting?.bankAccountTitle ?? "",
    number: setting?.bankAccountNumber ?? "",
    iban: setting?.bankIban ?? "",
    instructions: setting?.paymentInstructions ?? "",
  };

  const copies = ["BANK COPY", "OFFICE COPY", "STUDENT COPY"];

  copies.forEach((label, i) => {
    const top = PH - M - i * BAND;
    const bottom = top - BAND;
    const left = M + 10;
    const right = PW - M - 10;
    const innerW = right - left;

    // Divider line at the bottom of each band except the last page edge
    if (i < copies.length - 1) {
      dashed(page, bottom, M, PW - M);
    }

    // ---------- Header ----------
    // copy label chip — centred at the top
    let y = top - 15;
    const chipW = bold.widthOfTextAtSize(label, 7.5) + 16;
    const chipX = left + (innerW - chipW) / 2;
    page.drawRectangle({
      x: chipX,
      y: y - 2,
      width: chipW,
      height: 14,
      color: C_ACCENT,
    });
    txt(page, label, chipX + chipW - 8, y + 2, { font: bold, size: 7.5, color: rgb(1, 1, 1), align: "right" });

    // institute name — left, on the chip line
    txt(page, inst.toUpperCase(), left, y + 1, { font: bold, size: 12, color: C_HEAD, max: innerW / 2 - 20 });

    // left: tagline + contact ; right: dates
    y -= 13;
    txt(page, tagline, left, y, { font: italic, size: 7, color: C_MUTED, max: innerW * 0.55 });
    txt(page, `Issue Date: ${formatDate(challan.createdAt)}`, right, y, { font, size: 7, align: "right" });
    y -= 9;
    const contact = [address, phone, email].filter(Boolean).join("  ·  ");
    txt(page, contact, left, y, { font, size: 6.8, color: C_MUTED, max: innerW * 0.55 });
    txt(page, `Due Date: ${formatDate(challan.dueDate)}`, right, y, {
      font: bold,
      size: 7,
      color: overdue ? C_WARN : C_TEXT,
      align: "right",
    });

    y -= 9;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: C_LINE });
    y -= 12;

    // ---------- Student + Bank two columns ----------
    const colSplit = left + innerW * 0.5 + 4;
    const colWidth = innerW * 0.5 - 8;

    const drawKV = (
      x: number,
      yy: number,
      k: string,
      v: string,
      max: number,
    ) => {
      txt(page, k, x, yy, { font, size: 7, color: C_MUTED, max });
      txt(page, v || "-", x + 52, yy, { font: bold, size: 7.2, color: C_TEXT, max: max - 52 });
    };

    let ly = y;
    txt(page, "STUDENT DETAILS", left, ly, { font: bold, size: 7.5, color: C_ACCENT });
    txt(page, "PAYMENT / BANK DETAILS", colSplit, ly, { font: bold, size: 7.5, color: C_ACCENT });
    ly -= 11;
    drawKV(left, ly, "Name", challan.student.user.name, colWidth);
    drawKV(colSplit, ly, "Bank", bank.name, colWidth);
    ly -= 9;
    drawKV(left, ly, "Adm #", challan.student.admissionNo, colWidth);
    drawKV(colSplit, ly, "Branch", bank.branch, colWidth);
    ly -= 9;
    drawKV(left, ly, "Course", challan.student.course?.title ?? "-", colWidth);
    drawKV(colSplit, ly, "A/C Title", bank.title, colWidth);
    ly -= 9;
    drawKV(left, ly, "Guardian", challan.student.guardianName ?? "-", colWidth);
    drawKV(colSplit, ly, "A/C No", bank.number, colWidth);
    ly -= 9;
    drawKV(left, ly, "Contact", challan.student.user.phone ?? challan.student.guardianPhone ?? "-", colWidth);
    drawKV(colSplit, ly, "IBAN", bank.iban, colWidth);

    y = ly - 12;
    txt(page, `Fee Period: ${feePeriodLabel(challan)}`, left, y, { font: bold, size: 7.2, color: C_TEXT });
    y -= 12;

    // ---------- Fee table ----------
    const rowH = 11;
    page.drawRectangle({ x: left, y: y - 2, width: innerW, height: rowH, color: C_BG });
    txt(page, "Particulars", left + 4, y + 2, { font: bold, size: 7.2, color: C_HEAD });
    txt(page, `Amount (${currency})`, right - 4, y + 2, { font: bold, size: 7.2, color: C_HEAD, align: "right" });
    y -= rowH;

    for (const item of items) {
      txt(page, item.label, left + 4, y + 2, { font, size: 7.2, max: innerW - 90 });
      txt(page, formatCurrency(item.amount, currency), right - 4, y + 2, { font, size: 7.2, align: "right" });
      y -= rowH;
    }

    page.drawLine({ start: { x: left, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.4, color: C_LINE });

    // Total fee
    txt(page, "Total Fee", left + 4, y - 7, { font: bold, size: 8, color: C_HEAD });
    txt(page, formatCurrency(challan.amount, currency), right - 4, y - 7, { font: bold, size: 8, color: C_HEAD, align: "right" });
    y -= 16;

    // Total payable after due date (includes any late fee)
    const dueColor = challan.lateFee > 0 ? C_WARN : C_HEAD;
    txt(page, "Total Payable (after due date)", left + 4, y - 7, { font: bold, size: 8, color: dueColor });
    txt(page, formatCurrency(afterDue, currency), right - 4, y - 7, { font: bold, size: 8, color: dueColor, align: "right" });
    y -= 16;

    if (challan.lateFee > 0) {
      txt(page, `(includes late fee of ${formatCurrency(challan.lateFee, currency)})`, left + 4, y, {
        font: italic,
        size: 6.6,
        color: C_WARN,
      });
      y -= 10;
    }

    txt(page, `Amount in words: ${amountInWords(challan.amount, currency)}`, left, y, {
      font: italic,
      size: 6.8,
      color: C_MUTED,
      max: innerW,
    });
    y -= 10;

    if (challan.paidAmount > 0) {
      txt(page, `Received: ${formatCurrency(challan.paidAmount, currency)}    Balance: ${formatCurrency(balance, currency)}`, left, y, {
        font,
        size: 6.8,
        color: C_TEXT,
      });
      y -= 9;
    }

    if (bank.instructions) {
      txt(page, bank.instructions, left, y, { font, size: 6.6, color: C_MUTED, max: innerW - 130 });
    }

    // ---------- Footer ----------
    const footY = bottom + 14;
    page.drawLine({ start: { x: right - 130, y: footY + 4 }, end: { x: right, y: footY + 4 }, thickness: 0.6, color: C_LINE });
    txt(page, "Authorized Signature", right, footY - 4, { font, size: 6.6, color: C_MUTED, align: "right" });
  });

  const bytes = await doc.save();
  return new Response(bytes as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=challan-" + challan.challanNo + ".pdf",
      "Cache-Control": "no-store",
    },
  });
}
