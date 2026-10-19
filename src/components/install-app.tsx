"use client";

import { useEffect, useState } from "react";
import { Download, MoreVertical, PlusSquare, Share, X } from "lucide-react";

type Platform = "android" | "ios";

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

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.03-.9.9-1.99 1.4-3.06 1.31-.03-1.1.44-2.2 1.27-3.05.83-.85 2.02-1.44 3.04-1.29Zm4.33 15.67c-.55 1.26-.82 1.82-1.53 2.94-.99 1.55-2.39 3.48-4.12 3.5-1.54.01-1.93-1-4.02-.99-2.08.01-2.51 1-4.05.99-1.73-.02-3.06-1.76-4.05-3.31C.16 16.44-.09 11.28 1.86 8.51c1.38-1.96 3.56-3.1 5.62-3.1 2.09 0 3.4 1.01 5.13 1.01 1.68 0 2.7-1.01 5.12-1.01 1.83 0 3.77.99 5.15 2.72-4.52 2.48-3.78 8.93 2.82 8.97Z" />
    </svg>
  );
}

function InstallHelp({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Install on ${platform === "ios" ? "iPhone or iPad" : "Android"}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">
              Install on {platform === "ios" ? "iPhone / iPad" : "Android"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {platform === "ios"
                ? "Use Safari to add the SkillTek portal to your home screen."
                : "Use Chrome to add the SkillTek portal to your home screen."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-4 space-y-3 text-sm text-slate-600">
          {platform === "ios" ? (
            <>
              <li className="flex items-start gap-2.5">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Tap the <b className="text-slate-900">Share</b> button in Safari.
              </li>
              <li className="flex items-start gap-2.5">
                <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Scroll down and tap <b className="text-slate-900">Add to Home Screen</b>.
              </li>
              <li className="flex items-start gap-2.5">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Tap <b className="text-slate-900">Add</b> — SkillTek opens full-screen like an app.
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2.5">
                <MoreVertical className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Open the <b className="text-slate-900">⋮</b> menu in Chrome.
              </li>
              <li className="flex items-start gap-2.5">
                <PlusSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Choose <b className="text-slate-900">Install app</b> or <b className="text-slate-900">Add to Home screen</b>.
              </li>
              <li className="flex items-start gap-2.5">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Confirm — SkillTek opens full-screen like an app.
              </li>
            </>
          )}
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState<Platform | null>(null);

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
    setHelp("android");
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
        <button
          type="button"
          onClick={() => setHelp("ios")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-brand-400 hover:bg-brand-600/20"
        >
          <AppleMark className="h-4 w-4" />
          iPhone / iPad
        </button>
      </div>
      {installed && (
        <p className="mt-2 text-xs font-medium text-emerald-400">
          App installed on this device.
        </p>
      )}
      {help && <InstallHelp platform={help} onClose={() => setHelp(null)} />}
    </>
  );
}
