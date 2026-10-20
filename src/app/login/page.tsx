import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · SkillTek" };

const YEAR = new Date().getFullYear();

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <div
        aria-hidden="true"
        className="grid-lines grid-drift grid-page pointer-events-none fixed inset-0 opacity-40"
      />

      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-slate-900/60 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -left-16 h-[360px] w-[520px] rounded-full bg-brand-600/25 blur-[120px]" />
        <Link href="/" className="relative flex items-center">
          <Image
            src="/logos/main-logo.png"
            alt="SkillTek"
            width={2172}
            height={724}
            className="h-14 w-auto object-contain"
          />
        </Link>
        <div className="relative">
          <Image
            src="/logos/main-logo.png"
            alt="SkillTek"
            width={2172}
            height={724}
            className="mb-6 h-24 w-auto object-contain"
          />
          <h1 className="text-3xl font-bold">Institute Management Portal</h1>
          <p className="mt-3 max-w-md text-slate-300">
            A single platform for administrators, teachers and students —
            attendance, results, fees & challans, materials and more.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">
          © {YEAR} SkillTek Institute
        </p>
      </div>

      <div className="relative flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/" className="flex items-center">
              <Image
                src="/logos/main-logo.png"
                alt="SkillTek"
                width={2172}
                height={724}
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="mb-6 mt-1 text-sm text-slate-400">
              Sign in to access your dashboard.
            </p>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            New student?{" "}
            <Link
              href="/admissions"
              className="font-medium text-brand-300 hover:text-brand-200"
            >
              Apply for admission
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
