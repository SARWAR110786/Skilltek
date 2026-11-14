"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, homeForRole } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; redirectTo?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  let result: LoginState;
  try {
    result = await doLogin(formData);
  } catch (err) {
    console.error("[login] unexpected error:", err);
    // Never echo internal error details (DB hosts, stack info) to the browser.
    return {
      error: "Something went wrong signing you in. Please try again shortly.",
    };
  }
  if (result.redirectTo) {
    redirect(result.redirectTo);
  }
  return result;
}

async function doLogin(formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }
  // bcrypt only uses the first 72 bytes; cap input to avoid wasted CPU.
  if (email.length > 254 || password.length > 200) {
    return { error: "Invalid email or password." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const ipLimit = rateLimit(`login:ip:${ip}`, 10, 5 * 60_000);
  if (!ipLimit.ok) {
    return {
      error: `Too many attempts. Please try again in ${Math.ceil(
        ipLimit.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }
  const emailLimit = rateLimit(`login:email:${email}`, 5, 10 * 60_000);
  if (!emailLimit.ok) {
    return {
      error: `Too many attempts for this account. Please try again in ${Math.ceil(
        emailLimit.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await signSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { redirectTo: homeForRole(user.role) };
}
