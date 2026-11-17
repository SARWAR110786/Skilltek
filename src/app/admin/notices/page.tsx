import { connection } from "next/server";
import { Pin, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { notices } = await getData();
  const sp = await searchParams;

  return (
    <div>
      <PageHeader title="Notices" subtitle="Announcements for students and teachers" />

      {sp.error === "required" && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Title and body are required.
        </div>
      )}

      <Card className="mb-6">
        <CardHeader title="Publish Notice" />
        <form action={createNotice} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Title"><Input name="title" required /></Field>
          <Field label="Audience">
            <Select name="target" defaultValue="ALL">
              <option value="ALL">Everyone</option>
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
                <Badge tone="brand">{n.target}</Badge>
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
