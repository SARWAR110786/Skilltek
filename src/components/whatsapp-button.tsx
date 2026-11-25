// Floating "Let's have a chat!" button that opens SkillTek's WhatsApp.
const WHATSAPP = "923122098894"; // 0312 2098894
const MESSAGE = "Assalam o Alaikum SkillTek, I would like to know about your programs.";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener"
      aria-label="Chat with SkillTek on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3.5 pr-5 text-sm font-semibold text-white shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:bg-[#1ebe5b]"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.62c-1.95 0-3.86-.52-5.53-1.51l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.6 10.6 0 0 1 5.4 16c0-5.86 4.77-10.62 10.64-10.62 5.86 0 10.6 4.76 10.6 10.62 0 5.87-4.74 10.62-10.6 10.62Zm5.82-7.95c-.32-.16-1.89-.93-2.18-1.04-.3-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
      Let&apos;s have a chat!
    </a>
  );
}
