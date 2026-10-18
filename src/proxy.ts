import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, type Role } from "@/lib/session";

const ROUTE_ROLES: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/teacher", role: "TEACHER" },
  { prefix: "/student", role: "STUDENT" },
];

function signOut(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

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

  // Any public page ends the session, so returning to the portal (e.g. via
  // "Login Portal") always asks for credentials again.
  if (user) {
    return signOut(NextResponse.next());
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
  ],
};
