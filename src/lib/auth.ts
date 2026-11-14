import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionUser,
  type Role,
} from "@/lib/session";
import { prisma } from "@/lib/prisma";

export { SESSION_COOKIE, signSession, verifySession, homeForRole } from "@/lib/session";
export type { SessionUser, Role } from "@/lib/session";

// `use cache: private` memoizes the verified session per request on the
// server and lets the client router reuse it for the current user, so
// navigations don't block on `jwtVerify`. It is never stored in a server
// cache across requests.
//
// The JWT alone is not trusted: the account is re-checked in the database so
// a user who was deactivated, deleted or had their role changed loses access
// immediately instead of keeping a valid 7-day token.
export async function getSession(): Promise<SessionUser | null> {
  "use cache: private";
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE" || user.role !== session.role) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
