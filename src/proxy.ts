import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, homeForRole, type Role } from "@/lib/session";

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

  // Public pages keep the session alive so returning to the portal does not
  // require signing in again. Visiting /login while already signed in goes
  // straight to the matching dashboard.
  if (pathname === "/login" && user) {
    const url = req.nextUrl.clone();
    url.pathname = homeForRole(user.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

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
