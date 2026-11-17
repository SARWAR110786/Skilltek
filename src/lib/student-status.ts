export type StudentStatusValue = "ACTIVE" | "INACTIVE";
export type StudentExitReasonValue = "DROPOUT" | "PASSOUT" | null;

/**
 * Status dropdown values.
 * INACTIVE is a temporary login suspension — the student still takes part in
 * attendance, challans and every other feature. DROPOUT/PASSOUT are permanent
 * exits and are excluded from attendance.
 */
export const STUDENT_STATUS_ACTIVE = "ACTIVE";
export const STUDENT_STATUS_INACTIVE = "INACTIVE";
export const STUDENT_STATUS_DROPOUT = "DROPOUT";
export const STUDENT_STATUS_PASSOUT = "PASSOUT";

export function studentStatusValue(
  status: StudentStatusValue,
  exitReason?: StudentExitReasonValue,
): string {
  if (exitReason === "DROPOUT") return STUDENT_STATUS_DROPOUT;
  if (exitReason === "PASSOUT") return STUDENT_STATUS_PASSOUT;
  if (status === "INACTIVE") return STUDENT_STATUS_INACTIVE;
  return STUDENT_STATUS_ACTIVE;
}

/** Parse the Status dropdown value into the two persisted fields. */
export function normalizeStudentState(value: unknown): {
  status: StudentStatusValue;
  exitReason: StudentExitReasonValue;
} {
  const raw = String(value ?? "").trim();
  if (raw === STUDENT_STATUS_DROPOUT) return { status: "INACTIVE", exitReason: "DROPOUT" };
  if (raw === STUDENT_STATUS_PASSOUT) return { status: "INACTIVE", exitReason: "PASSOUT" };
  if (raw === STUDENT_STATUS_INACTIVE) return { status: "INACTIVE", exitReason: null };
  return { status: "ACTIVE", exitReason: null };
}

export function studentStatusTone(
  status: StudentStatusValue,
  exitReason?: StudentExitReasonValue,
): "green" | "amber" | "red" {
  if (status === "ACTIVE") return "green";
  if (exitReason) return "red";
  return "amber";
}

/** Single source of truth for how a student's status is displayed/exported. */
export function studentStatusLabel(
  status: StudentStatusValue,
  exitReason?: StudentExitReasonValue,
): string {
  if (status === "ACTIVE") return "ACTIVE";
  if (exitReason === "DROPOUT") return "Dropout";
  if (exitReason === "PASSOUT") return "Passout";
  return "Inactive";
}
