import { PageHero } from "@/components/page-hero";

export const metadata = {
  title: "Terms of Use · SkillTek",
  description:
    "The terms and conditions for using the SkillTek Institute website and student portal.",
};

const EFFECTIVE_DATE = "October 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing the SkillTek Institute website or student portal, you agree to these Terms of Use. If you do not agree, please do not use the service.",
    ],
  },
  {
    title: "2. Accounts and Access",
    body: [
      "Portal accounts are created by the institute administration. You are responsible for keeping your login credentials confidential and for all activity that occurs under your account.",
      "Do not share your account with others. Report any unauthorised use to the administration immediately.",
    ],
  },
  {
    title: "3. Acceptable Use",
    body: [
      "You agree not to misuse the portal, attempt to access data or areas you are not authorised to view, upload malicious content, or interfere with the normal operation of the service.",
    ],
  },
  {
    title: "4. Fees, Challans and Records",
    body: [
      "Fee challans, attendance records and results shown in the portal are provided for your convenience. In case of any discrepancy, the official records maintained by the institute office prevail.",
    ],
  },
  {
    title: "5. Intellectual Property",
    body: [
      "All content, materials and courseware provided through the portal remain the property of SkillTek Institute and may not be copied or redistributed without permission.",
    ],
  },
  {
    title: "6. Availability",
    body: [
      "We aim to keep the portal available at all times but do not guarantee uninterrupted service. We may suspend access for maintenance or updates.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    body: [
      "The portal is provided “as is”. SkillTek Institute is not liable for any indirect or incidental loss arising from your use of the service.",
    ],
  },
  {
    title: "8. Changes to These Terms",
    body: [
      "We may update these terms from time to time. Continued use of the portal after changes are posted means you accept the updated terms.",
    ],
  },
  {
    title: "9. Contact",
    body: [
      "For questions about these terms, contact us at theskilltek@gmail.com or 0312 2098894.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        subtitle={`Effective ${EFFECTIVE_DATE}. Please read these terms carefully before using our services.`}
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
      </section>
    </div>
  );
}
