import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const Body = z.object({
  kind: z.enum(["assignment", "quiz", "question"]),
  title: z.string().max(300).optional(),
  course: z.string().max(200).optional(),
  seed: z.string().max(1000).optional(),
});

const INSTRUCTIONS: Record<"assignment" | "quiz" | "question", string> = {
  assignment: `Write a clear assignment description for students (instructions, what to do, what to include, submission expectations).
Plain text only. 3-6 short lines. No markdown, no headers, no greetings.`,
  quiz: `Write a short description/instructions for students taking a quiz (scope, rules, time expectations).
Plain text only. 2-4 short lines. No markdown.`,
  question: `Write ONE exam-quality question for a quiz based on the topic/hint provided.
Plain text only, just the question text — no options, no answer, no markdown.`,
};

function templateText(
  kind: "assignment" | "quiz" | "question",
  title: string,
  course: string,
): string {
  const scope = [title, course].filter(Boolean).join(" — ");
  if (kind === "assignment") {
    return `Complete the assignment: ${scope || "as described by your teacher"}.\nFollow the instructions shared in class, show your work clearly, and submit your file before the deadline. Late submissions may not be graded.`;
  }
  if (kind === "quiz") {
    return `This quiz covers: ${scope || "recent course material"}.\nRead each question carefully. You have the allotted time to complete all questions. Make sure you have a stable connection before you start.`;
  }
  return `Explain the key concepts of ${scope || "the topic provided"} with a practical example.`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    return NextResponse.json(
      { error: "AI assist is only available to teachers and admins." },
      { status: 403 },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const course = (body.course ?? "").trim();
  const seed = (body.seed ?? "").trim();
  const apiKey = process.env.OPENAI_API_KEY;

  const contextParts = [
    title && `Title/topic: ${title}`,
    course && `Course: ${course}`,
    seed && `Current notes/hint: ${seed}`,
  ].filter(Boolean);

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
            {
              role: "system",
              content:
                "You are a writing assistant inside a school portal. You write short, practical, plain-text content for teachers. Never add greetings, signatures, or markdown formatting.",
            },
            {
              role: "user",
              content: `${INSTRUCTIONS[body.kind]}\n\n${contextParts.join("\n") || "Use a sensible generic topic."}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 350,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return NextResponse.json({ text });
      }
    } catch {
      /* fall through to template */
    }
  }

  return NextResponse.json({ text: templateText(body.kind, title, course) });
}
