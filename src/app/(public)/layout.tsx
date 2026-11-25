import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { CursorGlow } from "@/components/cursor-glow";
import { StructuredData } from "@/components/structured-data";
import { WhatsAppButton } from "@/components/whatsapp-button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <div
        aria-hidden="true"
        className="grid-lines grid-drift grid-page pointer-events-none fixed inset-0 opacity-50"
      />
      <StructuredData />
      <CursorGlow />
      <PublicNav />
      <div className="relative flex flex-1 flex-col">
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </div>
      <WhatsAppButton />
    </div>
  );
}
