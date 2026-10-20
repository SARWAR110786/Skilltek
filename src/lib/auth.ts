import { cache } from "react";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
  type Role,
} from "@/lib/session";

export { SESSION_COOKIE, signSession, verifySession, homeForRole } from "@/lib/session";
export type { SessionUser, Role } from "@/lib/session";

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
});

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
