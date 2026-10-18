import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Select,
  Table,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { deleteEnquiry, updateEnquiryStatus } from "./actions";

async function getEnquiries() {
  await connection();
  return prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });
}

const TONES: Record<string, "amber" | "blue" | "green" | "gray"> = {
  NEW: "amber",
  CONTACTED: "blue",
  ADMITTED: "green",
  CLOSED: "gray",
};

export default async function EnquiriesPage() {
  const enquiries = await getEnquiries();

  return (
    <div>
      <PageHeader title="Enquiries" subtitle={`${enquiries.length} lead${enquiries.length === 1 ? "" : "s"} from the website`} />

      <Card>
        <CardHeader title="Website Enquiries" />
        <Table head={["Name", "Contact", "Interest", "Message", "Received", "Status", ""]}>
          {enquiries.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50 align-top">
              <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {e.phone && <div>{e.phone}</div>}
                {e.email && <div>{e.email}</div>}
              </td>
              <td className="px-4 py-3 text-slate-600">{e.course?.title ?? e.service ?? "—"}</td>
              <td className="px-4 py-3 max-w-xs text-xs text-slate-500">{e.message ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(e.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge tone={TONES[e.status] ?? "gray"}>{e.status}</Badge>
                  <form action={updateEnquiryStatus} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={e.id} />
                    <Select name="status" defaultValue={e.status} className="!w-auto !py-1 text-xs">
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="ADMITTED">ADMITTED</option>
                      <option value="CLOSED">CLOSED</option>
                    </Select>
                    <button type="submit" className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                      Save
                    </button>
                  </form>
                </div>
              </td>
              <td className="px-4 py-3">
                <form action={deleteEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {enquiries.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No enquiries yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
