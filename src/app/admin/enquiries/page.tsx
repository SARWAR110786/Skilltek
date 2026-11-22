import { connection } from "next/server";
import { Download, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Card, CardHeader, PageHeader, Select, StatCard, Table } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteEnquiry, updateEnquiryStatus } from "./actions";

// Admission forms from the website. (Requests from the Services page are
// stored the same way, with a `service`, and listed separately below.)
async function getData() {
  await connection();
  return prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });
}

const STATUS = {
  NEW: { label: "New", tone: "amber" },
  CONTACTED: { label: "Contacted", tone: "blue" },
  ADMITTED: { label: "Admitted", tone: "green" },
  CLOSED: { label: "Closed", tone: "gray" },
} as const;

type Row = Awaited<ReturnType<typeof getData>>[number];

/** Table rows as a plain list (the sortable table reads its rows directly). */
function rowsFor(rows: Row[], kind: "admission" | "service") {
  return [
      ...rows.map((e) => {
        const st = STATUS[e.status];
        return (
          <tr key={e.id} className="align-top hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {e.phone && <div>{e.phone}</div>}
              {e.email && <div>{e.email}</div>}
              {!e.phone && !e.email && "—"}
            </td>
            <td className="px-4 py-3 text-slate-600">
              {(kind === "admission" ? e.course?.title : e.service) ?? "—"}
            </td>
            <td className="max-w-xs px-4 py-3 text-xs text-slate-500">{e.message ?? "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
              {formatDateTime(e.createdAt)}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge tone={st.tone}>{st.label}</Badge>
                <form action={updateEnquiryStatus} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={e.id} />
                  <Select name="status" defaultValue={e.status} className="!w-auto !py-1 text-xs">
                    {Object.entries(STATUS).map(([v, s]) => (
                      <option key={v} value={v}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Save
                  </button>
                </form>
              </div>
            </td>
            <td className="px-4 py-3">
              <ConfirmDelete
                action={deleteEnquiry}
                message={`Delete the ${kind === "admission" ? "admission form" : "request"} from ${e.name}?`}
                fields={<input type="hidden" name="id" value={e.id} />}
              >
                <Trash2 className="h-4 w-4" />
              </ConfirmDelete>
            </td>
          </tr>
        );
      }),
      ...(rows.length === 0
        ? [
            <tr key="empty">
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                {kind === "admission" ? "No admission forms yet." : "No service requests yet."}
              </td>
            </tr>,
          ]
        : []),
  ];
}

function DownloadButtons({ type }: { type: "admission" | "service" }) {
  const cls =
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600";
  return (
    <div className="flex shrink-0 gap-2">
      <a href={`/api/export/admissions?type=${type}&format=csv`} className={cls}>
        <Download className="h-3.5 w-3.5" /> CSV
      </a>
      <a href={`/api/export/admissions?type=${type}&format=pdf`} className={cls}>
        <Download className="h-3.5 w-3.5" /> PDF
      </a>
    </div>
  );
}

export default async function AdmissionsPage() {
  const all = await getData();
  const admissions = all.filter((e) => !e.service);
  const services = all.filter((e) => e.service);
  const count = (s: keyof typeof STATUS) => admissions.filter((e) => e.status === s).length;

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle={`${admissions.length} admission form${admissions.length === 1 ? "" : "s"} from the website`}
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New" value={count("NEW")} hint="Not contacted yet" tone="amber" />
        <StatCard label="Contacted" value={count("CONTACTED")} tone="blue" />
        <StatCard label="Admitted" value={count("ADMITTED")} tone="green" />
        <StatCard label="Closed" value={count("CLOSED")} tone="gray" />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Admission Forms"
          subtitle="Students who applied on the website"
          action={<DownloadButtons type="admission" />}
        />
        <Table head={["Name", "Contact", "Program", "Message", "Received", "Status", ""]}>
          {rowsFor(admissions, "admission")}
        </Table>
      </Card>

      {services.length > 0 && (
        <Card>
          <CardHeader
            title="Service Requests"
            subtitle="From the Services page (website, marketing, automation…)"
            action={<DownloadButtons type="service" />}
          />
          <Table head={["Name", "Contact", "Service", "Message", "Received", "Status", ""]}>
            {rowsFor(services, "service")}
          </Table>
        </Card>
      )}
    </div>
  );
}
