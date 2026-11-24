"use client";

import { useRef, useState } from "react";
import { MAX_FILE_BYTES, MAX_FILES } from "@/lib/upload-limits";

const COMPRESSIBLE = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i;
const MAX_SIDE = 1800; // px — still sharp for handwritten work and screenshots
const QUALITY = 0.82;

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shrinks a phone photo to a reasonable JPEG. Returns the original on any failure. */
async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file; // e.g. HEIC on browsers that can't decode it
  }
}

/**
 * File picker for assignment uploads. Photos are shrunk in the browser before
 * upload, and an over-limit selection is blocked with a clear message instead
 * of failing on the server.
 */
export function SmartFileInput({ name = "files" }: { name?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ tone: "info" | "ok" | "error"; text: string } | null>(null);

  async function onChange() {
    const input = ref.current;
    if (!input?.files) return;
    const picked = Array.from(input.files);
    input.setCustomValidity("");
    if (picked.length === 0) {
      setStatus(null);
      return;
    }
    if (picked.length > MAX_FILES) {
      const msg = `Please choose at most ${MAX_FILES} files.`;
      input.setCustomValidity(msg);
      setStatus({ tone: "error", text: msg });
      return;
    }

    const before = picked.reduce((s, f) => s + f.size, 0);
    if (picked.some((f) => COMPRESSIBLE.test(f.type) && f.size >= 400 * 1024)) {
      setStatus({ tone: "info", text: "Preparing your photos…" });
    }
    const files = await Promise.all(picked.map(compressImage));
    const after = files.reduce((s, f) => s + f.size, 0);

    // Put the (possibly smaller) files back into the input so the form sends them.
    if (files.some((f, i) => f !== picked[i]) && typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    }

    if (after > MAX_FILE_BYTES) {
      const msg = `Files are too large (${formatMB(after)}). The limit is ${formatMB(MAX_FILE_BYTES)} in total — remove a file or upload a smaller PDF.`;
      input.setCustomValidity(msg);
      setStatus({ tone: "error", text: msg });
      return;
    }
    setStatus({
      tone: "ok",
      text:
        after < before
          ? `Ready: ${files.length} file${files.length === 1 ? "" : "s"}, ${formatMB(after)} (reduced from ${formatMB(before)}).`
          : `Ready: ${files.length} file${files.length === 1 ? "" : "s"}, ${formatMB(after)}.`,
    });
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        name={name}
        multiple
        onChange={onChange}
        className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white"
      />
      <p
        className={`mt-1.5 text-xs ${
          status?.tone === "error"
            ? "font-medium text-rose-600"
            : status?.tone === "ok"
              ? "text-emerald-600"
              : "text-slate-500"
        }`}
        aria-live="polite"
      >
        {status?.text ??
          `Up to ${MAX_FILES} files, ${formatMB(MAX_FILE_BYTES)} in total. Photos are reduced automatically.`}
      </p>
    </div>
  );
}
