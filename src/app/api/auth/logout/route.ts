import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  // Signing out from any portal (admin, teacher, student) returns to the main
  // website. The Location is relative on purpose: behind Hostinger's proxy the
  // request URL is the internal server address, not theskilltek.com.
  // 303 makes the browser follow up with a GET.
  const res = new Response(null, { status: 303, headers: { Location: "/" } });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  );
  return res;
}
