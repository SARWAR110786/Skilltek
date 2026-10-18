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
  { href: "/admin/challans", label: "Challans", icon: "challans" },
  { href: "/admin/notices", label: "Notices", icon: "notices" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "enquiries" },
  { href: "/admin/gallery", label: "Gallery", icon: "gallery" },
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
