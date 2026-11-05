"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </div>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-300">
          Email address
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-300">
          Password
        </span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 z-10 flex w-10 cursor-pointer items-center justify-center rounded-r-lg bg-transparent text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:text-brand-400"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={2.2} />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Sign in
          </>
        )}
      </button>
    </form>
  );
}
