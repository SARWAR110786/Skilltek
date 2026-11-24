// Shared handling for files uploaded through Server Actions (assignment
// attachments and student submissions). Files are stored in Postgres, so the
// limits are deliberately small.

import { MAX_FILE_BYTES, MAX_FILES } from "@/lib/upload-limits";
export { MAX_FILE_BYTES, MAX_FILES };

// Executable / script formats that are never useful for coursework.
const BLOCKED_EXT = /\.(exe|msi|bat|cmd|com|scr|ps1|sh|js|mjs|vbs|jar|apk|dll|html?|svg|xhtml)$/i;

export type UploadedFile = {
  fileName: string;
  mimeType: string;
  size: number;
  // Prisma `Bytes` expects a Uint8Array backed by a plain ArrayBuffer.
  data: Uint8Array<ArrayBuffer>;
};

export type UploadResult =
  | { ok: true; files: UploadedFile[] }
  | { ok: false; error: "filesize" | "filetype" | "filecount" };

export async function readUploadedFiles(formData: FormData): Promise<UploadResult> {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_FILES) return { ok: false, error: "filecount" };
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_FILE_BYTES) return { ok: false, error: "filesize" };
  if (files.some((f) => BLOCKED_EXT.test(f.name))) return { ok: false, error: "filetype" };

  return {
    ok: true,
    files: await Promise.all(
      files.map(async (f) => ({
        fileName: f.name.slice(0, 200),
        mimeType: (f.type || "application/octet-stream").slice(0, 100),
        size: f.size,
        data: new Uint8Array(await f.arrayBuffer()),
      })),
    ),
  };
}

export const UPLOAD_ERROR_TEXT: Record<string, string> = {
  filesize: "Files are too large. The total upload limit is 6 MB — photos are reduced automatically, but large PDFs or videos must be smaller.",
  filetype: "That file type is not allowed. Please upload documents, images, PDFs or ZIP files.",
  filecount: "Too many files. You can upload up to 5 files at a time.",
};
