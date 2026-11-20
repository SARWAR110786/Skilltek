import { connection } from "next/server";
import { Pin, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
} from "@/components/ui";

import { formatDateTime } from "@/lib/utils";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createNotice, deleteNotice } from "./actions";

const AUDIENCE = { ALL: "Everyone · Website", STUDENTS: "Students", TEACHERS: "Teachers" } as const;

async function getData() {
  await connection();
  const notices = await prisma.notice.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { createdBy: true },
  });
  return { notices };
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; deleted?: string }>;
}) {
  const { notices } = await getData();
  const sp = await searchParams;

  return (
    <div>
      <PageHeader title="Notices" subtitle="Announcements for students and teachers" />

      {sp.error === "required" && <Alert tone="error">Please write a title and a message.</Alert>}
      {sp.error === "long" && (
        <Alert tone="error">The title can be up to 150 characters and the message up to 5,000.</Alert>
      )}
      {sp.created === "1" && (
        <Alert tone="success">
          Notice published. It now shows in the selected portal(s); &quot;Everyone&quot; notices also show on
          the website.
        </Alert>
      )}
      {sp.deleted === "1" && <Alert tone="success">Notice deleted.</Alert>}

      <Card className="mb-6">
        <CardHeader title="Publish Notice" />
        <form action={createNotice} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Title"><Input name="title" required maxLength={150} /></Field>
          <Field label="Audience">
            <Select name="target" defaultValue="ALL">
              <option value="ALL">Everyone (also shown on the website)</option>
              <option value="STUDENTS">All Students</option>
              <option value="TEACHERS">All Teachers</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Message">
              <textarea
                name="message"
                rows={5}
                required
                maxLength={5000}
                placeholder="Write the notice details..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 self-end text-sm text-slate-600">
            <input type="checkbox" name="pinned" className="h-4 w-4 rounded" /> Pin to top
          </label>
          <div className="md:col-span-2"><Button type="submit">Publish Notice</Button></div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Published Notices" />
        <Table head={["Title", "Audience", "By", "Date", ""]}>
          {notices.map((n) => (
            <tr key={n.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="flex items-center gap-1 font-medium text-slate-800">
                  {n.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  {n.title}
                </p>
                <p className="line-clamp-1 text-xs text-slate-400">{n.body}</p>
              </td>
              <td className="px-4 py-3">
                <Badge tone="brand">{AUDIENCE[n.target]}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{n.createdBy?.name ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(n.createdAt)}</td>
              <td className="px-4 py-3">
                <ConfirmDelete
                  action={deleteNotice}
                  message={`Delete notice "${n.title}"?`}
                  fields={<input type="hidden" name="id" value={n.id} />}
                >
                  <Trash2 className="h-4 w-4" />
                </ConfirmDelete>
              </td>
            </tr>
          ))}
          {notices.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No notices yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
