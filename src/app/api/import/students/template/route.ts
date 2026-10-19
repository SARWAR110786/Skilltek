import { getSession } from "@/lib/auth";
import { csvResponse } from "@/lib/export";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  return csvResponse("students-import-template", [
    [
      "Name",
      "Email",
      "Password",
      "Phone",
      "CNIC",
      "Gender",
      "Course",
      "Guardian Name",
      "Guardian Phone",
      "Address",
    ],
    [
      "Ali Khan",
      "ali.khan@example.com",
      "Pass@123",
      "0300-1234567",
      "35202-1234567-1",
      "Male",
      "Web Development",
      "Mr. Khan",
      "0300-7654321",
      "House 12, Lahore",
    ],
  ]);
}
