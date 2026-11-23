import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://theskilltek.com";
const SITE_TITLE = "SkillTek Institute & Media Solutions";
const SITE_DESCRIPTION =
  "IT & AI courses in Thatta. Apply online, verify a student's status and access the student portal — plus websites, digital marketing and AI automation for businesses.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SkillTek Institute",
  description: SITE_DESCRIPTION,
  // Link previews on WhatsApp, Facebook, LinkedIn, X and others.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "SkillTek",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_PK",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SkillTek Institute — Learn today, lead tomorrow. Admissions open.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  applicationName: "SkillTek",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SkillTek",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const instant = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
