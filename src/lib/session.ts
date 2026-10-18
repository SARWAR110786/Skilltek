import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "skilltek_session";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET is not set. Refusing to sign or verify sessions with a default secret in production.",
      );
    }
    return new TextEncoder().encode(
      "skilltek-dev-secret-change-this-in-production",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export function homeForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
      return "/student";
    default:
      return "/login";
  }
}
