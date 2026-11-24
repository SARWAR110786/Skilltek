// Shared by the server (validation) and the browser (pre-upload checks).
// Files are stored in Postgres, so keep these modest; photos are shrunk in the
// browser before upload (see components/smart-file-input.tsx).
export const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6 MB per submission (all files)
export const MAX_FILES = 5;
