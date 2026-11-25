import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/guard";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/teachers", label: "Teachers", icon: "teachers" },
  { href: "/admin/courses", label: "Courses", icon: "courses" },
  { href: "/admin/attendance", label: "Attendance", icon: "attendance" },
  { href: "/admin/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/admin/assignments", label: "Assignments", icon: "assignments" },
  { href: "/admin/assessments", label: "Assessments", icon: "assessment" },
  { href: "/admin/performance", label: "Performance", icon: "performance" },
  {
    href: "/admin/challans",
    label: "Finance",
    icon: "finance",
    match: ["/admin/challans", "/admin/expenses", "/admin/reports"],
  },
  { href: "/admin/notices", label: "Notices", icon: "notices" },
  { href: "/admin/testimonials", label: "Success Stories", icon: "stories" },
  { href: "/admin/enquiries", label: "Admissions", icon: "enquiries" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("ADMIN");
  return (
    <DashboardShell
      user={{ name: user.name, email: user.email }}
      nav={NAV}
      roleLabel="Administrator"
    >
      {children}
    </DashboardShell>
  );
}
