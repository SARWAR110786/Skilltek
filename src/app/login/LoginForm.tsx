"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <Field label="Email address">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
        />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Sign in
          </>
        )}
      </Button>
    </form>
  );
}
