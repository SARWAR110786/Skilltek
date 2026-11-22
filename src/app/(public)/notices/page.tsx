import { permanentRedirect } from "next/navigation";

// Notices are for students and teachers in their portals only.
export default function NoticesPage() {
  permanentRedirect("/");
}
