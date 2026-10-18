import {
  Bot,
  Globe,
  Megaphone,
  Palette,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type Service = { icon: LucideIcon; title: string; text: string };

export const SERVICES: Service[] = [
  {
    icon: Globe,
    title: "Website Development",
    text: "Fast, responsive websites and web apps — from landing pages to full portals.",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    text: "Social media, paid ads, SEO and content that grow your reach and sales.",
  },
  {
    icon: Bot,
    title: "AI Automation",
    text: "Chatbots, AI assistants and smart workflows that answer and assist 24/7.",
  },
  {
    icon: Workflow,
    title: "Business Automation",
    text: "Automate operations, billing, CRM and internal tools to save time and cost.",
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    text: "Android and iOS apps designed to put your business in your customers' hands.",
  },
  {
    icon: Palette,
    title: "Branding & Design",
    text: "Logos, UI/UX and complete brand identity that make you stand out.",
  },
];
