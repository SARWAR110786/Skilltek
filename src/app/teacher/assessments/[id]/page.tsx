import { connection } from "next/server";
import { requireUser } from "@/lib/guard";
import { AssessmentDetail } from "@/components/assessment-detail";

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; updated?: string; error?: string }>;
}) {
  await connection();
  const user = await requireUser("TEACHER");
  const { id } = await params;
  return <AssessmentDetail user={user} id={id} sp={await searchParams} />;
}
