import { PageHero } from "@/components/page-hero";

export const metadata = {
  title: "Privacy Policy · SkillTek",
  description:
    "How SkillTek Institute collects, uses and protects your personal information.",
};

const EFFECTIVE_DATE = "October 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Information We Collect",
    body: [
      "When you submit an enquiry, apply for admission or use the student portal, we collect information you provide such as your name, email address, phone number, CNIC, date of birth, address and academic details.",
      "When you sign in, we create a secure session cookie so you stay logged in. We do not store your password in readable form — passwords are encrypted using industry-standard hashing.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "We use your information to process admissions, manage your enrolment, record attendance, issue results and fee challans, share notices, and communicate with you about your studies.",
      "We may also use aggregated, non-identifying information to improve our programs and website.",
    ],
  },
  {
    title: "3. Sharing of Information",
    body: [
      "We do not sell your personal information. We only share it with staff and faculty who need it to deliver our services, or where required by law.",
    ],
  },
  {
    title: "4. Data Security",
    body: [
      "We take reasonable technical and organisational measures to protect your data, including encrypted connections, hashed passwords and role-based access controls so that students, teachers and administrators only see the data they are permitted to see.",
    ],
  },
  {
    title: "5. Your Rights",
    body: [
      "You may request access to, correction of, or deletion of your personal information by contacting the administration. Students and staff can request account deletion through the institute office.",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "We use a single essential session cookie to keep you signed in. We do not use advertising or third-party tracking cookies.",
    ],
  },
  {
    title: "7. Contact Us",
    body: [
      "For any privacy-related questions, contact us at theskilltek@gmail.com or 0312 2098894.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Effective ${EFFECTIVE_DATE}. This policy explains how we handle your personal information.`}
      />

      <section className="mx-auto max-w-3xl px-4 py-14 lg:py-20">
        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-white">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-slate-400">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
          By using the SkillTek website and portal you agree to this Privacy
          Policy. We may update it from time to time and will post the new
          version on this page.
        </p>
      </section>
    </div>
  );
}
