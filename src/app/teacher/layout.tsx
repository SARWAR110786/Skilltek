import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/guard";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Overview", icon: "dashboard" },
  { href: "/teacher/attendance", label: "Attendance", icon: "attendance" },
  { href: "/teacher/students", label: "My Students", icon: "students" },
  { href: "/teacher/courses", label: "My Courses", icon: "courses" },
  { href: "/teacher/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/teacher/assignments", label: "Assignments", icon: "assignments" },
  { href: "/teacher/assessments", label: "Assessments", icon: "assessment" },
  { href: "/teacher/quiz-bank", label: "Quiz Bank", icon: "quizbank" },
  { href: "/teacher/notices", label: "Notices", icon: "notices" },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("TEACHER");
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      nav={NAV}
      roleLabel="Teacher"
    >
      {children}
    </DashboardShell>
  );
}
