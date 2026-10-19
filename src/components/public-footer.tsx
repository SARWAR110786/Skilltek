import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { InstallApp } from "@/components/install-app";

const YEAR = new Date().getFullYear();

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logos/main-logo.png"
              alt="SkillTek Institute"
              width={2172}
              height={724}
              className="h-16 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            A modern institute committed to quality education, industry-aligned
            programs and a complete digital campus experience.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Affiliated Programs
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Certified Faculty
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Placement Support
            </span>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Get the SkillTek app</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Install the portal on your phone for one-tap access to classes, results and notices.
            </p>
            <div className="mt-3">
              <InstallApp />
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { href: "/courses", label: "Programs" },
              { href: "/services", label: "Tech Solutions" },
              { href: "/admissions", label: "Admissions" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
              { href: "/login", label: "Student Portal" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">Get in Touch</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street, Thatta
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-brand-400" />
              0312 2098894
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-brand-400" />
              theskilltek@gmail.com
            </li>
          </ul>
          <Link
            href="/admissions"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
          >
            Apply Now <Send className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <span>© {YEAR} SkillTek Institute. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-slate-300">
              Terms of Use
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
