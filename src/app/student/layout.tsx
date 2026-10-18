import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/guard";

const NAV: NavItem[] = [
  { href: "/student", label: "Overview", icon: "dashboard" },
  { href: "/student/attendance", label: "Attendance", icon: "attendance" },
  { href: "/student/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/student/assignments", label: "Assignments", icon: "assignments" },
  { href: "/student/challans", label: "Challans", icon: "challans" },
  { href: "/student/notices", label: "Notices", icon: "notices" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("STUDENT");
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      nav={NAV}
      roleLabel="Student"
    >
      {children}
    </DashboardShell>
  );
}
