import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, type Role } from "@/lib/session";
import { isBlockedAgent } from "@/lib/blocked-bots";

const ROUTE_ROLES: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/teacher", role: "TEACHER" },
  { prefix: "/student", role: "STUDENT" },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // AI crawlers and scraping tools may not copy the site. robots.txt stays
  // readable so well-behaved bots can see they are not allowed.
  if (pathname !== "/robots.txt" && isBlockedAgent(req.headers.get("user-agent"))) {
    return new NextResponse("Automated access to this website is not permitted.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noai, noimageai" },
    });
  }

  const matched = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));

  if (matched) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const user = token ? await verifySession(token) : null;
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
  // Every page and API route, except Next.js build assets and the icons.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
