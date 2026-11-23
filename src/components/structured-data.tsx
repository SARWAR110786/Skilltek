import { SOCIAL_LINKS } from "@/components/social-links";

const SITE = "https://theskilltek.com";

/**
 * Tells Google who SkillTek is (name, logo, contact, social profiles) so the
 * site, Facebook and Instagram are understood as one organisation.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE}/#organization`,
        name: "SkillTek Institute & Media Solutions",
        alternateName: ["SkillTek", "The SkillTek", "theskilltek"],
        url: SITE,
        logo: `${SITE}/icons/icon-512.png`,
        image: `${SITE}/og-image.jpg`,
        description:
          "IT & AI courses in Thatta, plus websites, digital marketing and AI automation for businesses.",
        email: "theskilltek@gmail.com",
        telephone: "+92-312-2098894",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street",
          addressLocality: "Thatta",
          addressRegion: "Sindh",
          addressCountry: "PK",
        },
        sameAs: SOCIAL_LINKS.map((s) => s.href),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "SkillTek",
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; the data above is static and trusted.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
