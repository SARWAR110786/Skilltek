import { connection } from "next/server";
import { requireUser } from "@/lib/guard";
import { AssessmentsList } from "@/components/assessments-list";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; error?: string; deleted?: string }>;
}) {
  await connection();
  const user = await requireUser("ADMIN");
  return <AssessmentsList user={user} sp={await searchParams} />;
}
