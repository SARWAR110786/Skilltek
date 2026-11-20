import { connection } from "next/server";
import { PageHero } from "@/components/page-hero";
import { NoticesList, getPublicNotices } from "@/components/public-notices";

export const metadata = { title: "Notices · SkillTek" };

export default async function NoticesPage() {
  await connection();
  const notices = await getPublicNotices();
  return (
    <div>
      <PageHero
        eyebrow="Announcements"
        title="Notices"
        subtitle="News and announcements from SkillTek Institute."
      />
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <NoticesList notices={notices} />
      </section>
    </div>
  );
}
