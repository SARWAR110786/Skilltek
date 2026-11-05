"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui";
import {
  CNIC_HINT,
  CNIC_PATTERN,
  PHONE_HINT,
  PHONE_PATTERN,
} from "@/lib/validation";

type NumericInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  mode: "phone" | "cnic";
};

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

function sanitizeCnic(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function NumericInput({
  mode,
  defaultValue,
  placeholder,
  autoComplete,
  ...props
}: NumericInputProps) {
  const isCnic = mode === "cnic";
  const sanitize = isCnic ? sanitizeCnic : sanitizePhone;
  const [value, setValue] = useState(() =>
    sanitize(String(defaultValue ?? "")),
  );

  useEffect(() => {
    setValue(sanitize(String(defaultValue ?? "")));
  }, [defaultValue, mode]);

  return (
    <Input
      {...props}
      type={isCnic ? "text" : "tel"}
      inputMode={isCnic ? "numeric" : "tel"}
      value={value}
      onChange={(event) => setValue(sanitize(event.target.value))}
      pattern={isCnic ? CNIC_PATTERN : PHONE_PATTERN}
      title={isCnic ? CNIC_HINT : PHONE_HINT}
      placeholder={placeholder ?? (isCnic ? "41409-1234567-1" : "0300-1234567")}
      maxLength={isCnic ? 15 : 11}
      autoComplete={autoComplete ?? (isCnic ? "off" : "tel")}
    />
  );
}
