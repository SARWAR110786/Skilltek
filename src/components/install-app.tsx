"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function AndroidMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18a.4.4 0 1 0-.69-.4l-1.87 3.23a11.4 11.4 0 0 0-9.76 0L5.25 5.9a.4.4 0 1 0-.69.4L6.4 9.48A10.9 10.9 0 0 0 0 19h24a10.9 10.9 0 0 0-6.4-9.52ZM7 16.25a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Zm10 0a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z" />
    </svg>
  );
}

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function downloadApk() {
    const link = document.createElement("a");
    link.href = "/downloads/skilltek.apk";
    link.download = "SkillTek.apk";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function androidInstall() {
    if (installed) return;
    if (promptEvent) {
      await promptEvent.prompt();
      try {
        await promptEvent.userChoice;
      } catch {
        /* ignore */
      }
      setPromptEvent(null);
      return;
    }
    downloadApk();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={androidInstall}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-brand-400 hover:bg-brand-600/20"
        >
          <AndroidMark className="h-4 w-4" />
          Android
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Android without Chrome install?{" "}
        <button
          type="button"
          onClick={downloadApk}
          className="font-medium text-brand-300 underline underline-offset-2 hover:text-brand-200"
        >
          Download the APK
        </button>
      </p>
      {installed && (
        <p className="mt-2 text-xs font-medium text-emerald-400">
          App installed on this device.
        </p>
      )}
    </>
  );
}
