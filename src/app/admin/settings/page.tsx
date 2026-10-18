import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { updateSettings } from "./actions";

async function getSettings() {
  await connection();
  return prisma.setting.findUnique({ where: { id: "singleton" } });
}

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Institute information used across the site" />

      <Card>
        <CardHeader title="Institute Profile" />
        <form action={updateSettings} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Institute Name"><Input name="instituteName" defaultValue={s?.instituteName ?? "SkillTek"} /></Field>
          <Field label="Tagline"><Input name="tagline" defaultValue={s?.tagline ?? ""} /></Field>
          <Field label="Email"><Input name="email" type="email" defaultValue={s?.email ?? ""} /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={s?.phone ?? ""} /></Field>
          <div className="md:col-span-2">
            <Field label="Address"><Input name="address" defaultValue={s?.address ?? ""} /></Field>
          </div>
          <Field label="Currency" hint="e.g. PKR, USD, INR"><Input name="currency" defaultValue={s?.currency ?? "PKR"} /></Field>

          <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-800">Banking / Payment Details</h3>
            <p className="text-sm text-slate-500">
              These appear automatically on every fee challan so students know where to pay.
            </p>
          </div>
          <Field label="Bank Name"><Input name="bankName" defaultValue={s?.bankName ?? ""} placeholder="e.g. Meezan Bank" /></Field>
          <Field label="Branch"><Input name="bankBranch" defaultValue={s?.bankBranch ?? ""} placeholder="e.g. Gulberg III, Lahore" /></Field>
          <Field label="Account Title"><Input name="bankAccountTitle" defaultValue={s?.bankAccountTitle ?? ""} placeholder="e.g. SkillTek Institute" /></Field>
          <Field label="Account Number"><Input name="bankAccountNumber" defaultValue={s?.bankAccountNumber ?? ""} placeholder="e.g. 01234567890123" /></Field>
          <div className="md:col-span-2">
            <Field label="IBAN"><Input name="bankIban" defaultValue={s?.bankIban ?? ""} placeholder="e.g. PK00MEZN0000000123456789" /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Payment Instructions">
              <Textarea
                name="paymentInstructions"
                rows={2}
                defaultValue={s?.paymentInstructions ?? ""}
                placeholder="e.g. Submit a copy of this challan at any branch or via online transfer."
              />
            </Field>
          </div>

          <div className="md:col-span-2"><Button type="submit">Save Settings</Button></div>
        </form>
      </Card>
    </div>
  );
}
