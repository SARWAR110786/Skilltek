import { permanentRedirect } from "next/navigation";

// Contact details now live on the Admissions page.
export default function ContactPage() {
  permanentRedirect("/admissions#contact");
}
