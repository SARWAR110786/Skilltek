"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { changePassword, type PasswordState } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 p-5 md:grid-cols-2">
      {state.error && (
        <div className="md:col-span-2">
          <Alert tone="error">{state.error}</Alert>
        </div>
      )}
      {state.success && (
        <div className="md:col-span-2">
          <Alert tone="success">{state.success}</Alert>
        </div>
      )}

      <div className="md:col-span-2">
        <Field label="Current password">
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </div>
      <Field label="New password" hint="At least 8 characters">
        <Input
          name="newPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label="Confirm new password">
        <Input
          name="confirmPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </Field>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" /> Update password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
