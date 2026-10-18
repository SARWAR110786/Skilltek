import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · SkillTek" };

const YEAR = new Date().getFullYear();

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/main-logo.png"
            alt="SkillTek"
            width={2172}
            height={724}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div>
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
        <p className="text-sm text-slate-400">
          © {YEAR} SkillTek Institute
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center">
              <Image
                src="/logos/main-logo.png"
                alt="SkillTek"
                width={2172}
                height={724}
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mb-6 text-sm text-slate-500">
            Sign in to access your dashboard.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
