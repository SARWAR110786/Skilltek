import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, type Role } from "@/lib/session";

const ROUTE_ROLES: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/teacher", role: "TEACHER" },
  { prefix: "/student", role: "STUDENT" },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySession(token) : null;

  const matched = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));

  if (matched) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (user.role !== matched.role) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // The login form is always shown so a password is required even when a
  // session cookie is still present.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/login",
    "/",
    "/about",
    "/courses",
    "/services",
    "/admissions",
    "/contact",
    "/download",
  ],
};
