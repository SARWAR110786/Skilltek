import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

/** Problem codes shown as a friendly banner (see components/problem-banner.tsx). */
export type ProblemCode = "duplicate" | "notfound" | "inuse" | "busy" | "failed";

function classify(err: unknown): ProblemCode {
  const e = err as { code?: string; message?: string; cause?: { code?: string } };
  const code = e?.code ?? "";
  const msg = `${e?.message ?? ""} ${e?.cause?.code ?? ""}`;
  if (code === "P2002") return "duplicate"; // unique value already used
  if (code === "P2025" || code === "P2001" || code === "P2018") return "notfound"; // already deleted / changed
  if (code === "P2003" || code === "P2014") return "inuse"; // linked records exist
  if (
    /^P10(0[0-2]|08|17)$/.test(code) ||
    code === "P2024" ||
    /ECONN|ETIMEDOUT|EAI_AGAIN|timeout|Can't reach database|Connection terminated|too many clients/i.test(msg)
  ) {
    return "busy";
  }
  return "failed";
}

// Success flags a page may show; never keep them next to a problem message.
const SUCCESS_FLAGS = ["created", "updated", "deleted", "saved", "paid", "submitted", "sent", "published", "imported"];

/**
 * Runs a Server Action. Expected failures (duplicates, already-deleted items,
 * linked records, a busy database) send the user back to the page they were on
 * with a friendly message instead of the crash page. Next.js redirects and
 * not-found signals pass through untouched.
 */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    const problem = classify(err);
    console.error(`[action] ${problem}:`, err);

    let target = "/";
    try {
      const referer = (await headers()).get("referer");
      if (referer) {
        const url = new URL(referer);
        url.searchParams.delete("error");
        url.searchParams.delete("problem");
        for (const flag of SUCCESS_FLAGS) url.searchParams.delete(flag);
        url.searchParams.set("problem", problem);
        target = `${url.pathname}?${url.searchParams.toString()}`;
      }
    } catch {
      // keep "/"
    }
    redirect(target);
  }
}
