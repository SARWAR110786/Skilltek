import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the AI assistant for SkillTek, which runs an education institute and a tech solutions arm (SkillTek Media Solutions).
Help visitors with questions about courses, admissions, timings and the student portal.
You also answer questions about our tech solutions — website development, digital marketing,
AI automation, business automation, mobile apps and branding & design.
Be concise, friendly and professional. If you don't know something specific (like exact fees or quotes),
suggest contacting the institute, submitting an enquiry or visiting the Services page.
Never invent specific prices unless given below.`;

function fallbackReply(userText: string, context: string): string {
  const t = userText.toLowerCase();
  if (t.includes("fee") || t.includes("price") || t.includes("cost"))
    return "Our fee structure is shared on request. Please submit an enquiry on the Admissions page and our team will send you the complete details. Would you like help applying?";
  if (t.includes("admission") || t.includes("apply") || t.includes("enroll"))
    return "To apply, visit our Admissions page and submit the online form. Our team will contact you shortly.";
  if (t.includes("course") || t.includes("program") || t.includes("learn"))
    return `We offer several programs. ${context || "Please visit the Courses page to explore them."}`;
  if (t.includes("time") || t.includes("timing") || t.includes("schedule"))
    return "Class timings vary by course. Once enrolled, our team will share your schedule.";
  if (t.includes("portal") || t.includes("login") || t.includes("student"))
    return "Once enrolled, you can log in to the Student Portal to view notices and your course details.";
  if (
    t.includes("website") ||
    t.includes("web") ||
    t.includes("marketing") ||
    t.includes("seo") ||
    t.includes("automation") ||
    t.includes("app") ||
    t.includes("design") ||
    t.includes("brand") ||
    t.includes("solution") ||
    t.includes("service")
  )
    return "Yes! Beyond education, SkillTek offers tech solutions — website development, digital marketing, AI automation, business automation, mobile apps and branding. Please visit our Services page and submit a request; our team will get back to you.";
  if (t.includes("hello") || t.includes("hi") || t.includes("hey"))
    return "Hello! How can I help you with SkillTek today?";
  return "Thanks for your message! For detailed help, please contact us via the Contact page or apply online through Admissions.";
}

export async function POST(req: Request) {
  const limit = rateLimit(`chat:${clientIp(req)}`, 20, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        reply: `You're sending messages too quickly. Please wait ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minute(s) and try again.`,
      },
      { status: 429 },
    );
  }

  let messages: Msg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ reply: "Invalid request." }, { status: 400 });
  }

  let context = "";
  try {
    const courses = await prisma.course.findMany({
      where: { active: true },
      take: 8,
      select: { title: true, durationMonths: true },
    });
    if (courses.length) {
      context = `Our courses include: ${courses
        .map((c) => `${c.title} (${c.durationMonths} months)`)
        .join(", ")}.`;
    }
  } catch {
    /* ignore */
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: `${SYSTEM_PROMPT}\n\nContext: ${context}` },
            ...messages.slice(-10),
          ],
          temperature: 0.6,
          max_tokens: 400,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) return NextResponse.json({ reply });
      }
    } catch {
      /* fall through to fallback */
    }
  }

  return NextResponse.json({
    reply: fallbackReply(lastUser?.content ?? "", context),
  });
}
