import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const AiKind = z.enum([
  "assignment",
  "quiz",
  "question",
  "course",
  "mcq",
  "notice",
]);

const Body = z.object({
  kind: AiKind,
  title: z.string().max(300).optional(),
  course: z.string().max(200).optional(),
  seed: z.string().max(1000).optional(),
});

type Kind = z.infer<typeof AiKind>;

const INSTRUCTIONS: Record<Kind, string> = {
  assignment: `Write a clear assignment description for students (instructions, what to do, what to include, submission expectations).
Plain text only. 3-6 short lines. No markdown, no headers, no greetings.`,
  quiz: `Write a short description/instructions for students taking a quiz (scope, rules, time expectations).
Plain text only. 2-4 short lines. No markdown.`,
  question: `Write ONE exam-quality question for a quiz based on the topic/hint provided.
Plain text only, just the question text — no options, no answer, no markdown.`,
  course: `Write a short, attractive course description for a school website (what students will learn, who it is for, outcomes).
Plain text only. 2-4 short sentences. No markdown, no greetings.`,
  notice: `Write a clear, friendly notice/announcement for students and teachers in a school portal (what is happening, when, what people should do, and any important details).
Plain text only. 2-5 short sentences. No markdown, no headers, no greetings or signatures.`,
  mcq: `Create ONE multiple-choice question for a quiz based on the topic/hint provided.
Return ONLY valid JSON in exactly this shape:
{"text":"the question","optionA":"first option","optionB":"second option","optionC":"third option","optionD":"fourth option","correctOption":"A"}
Rules: exactly four plausible options, exactly one correct answer, correctOption must be one of "A","B","C","D". No markdown, no explanation.`,
};

const Mcq = z.object({
  text: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

type Mcq = z.infer<typeof Mcq>;

function templateText(
  kind: Exclude<Kind, "mcq">,
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
  if (kind === "course") {
    return `Learn ${scope || "the essential skills of this course"} through hands-on lessons and practical projects.\nDesigned for beginners and professionals who want to build real-world skills with guidance from experienced instructors.`;
  }
  if (kind === "notice") {
    return `Please note: ${scope || "an important update from the institute"}.\nAll students and staff are requested to take note of the details and act accordingly. For any questions, contact the administration office.`;
  }
  return `Explain the key concepts of ${scope || "the topic provided"} with a practical example.`;
}

function templateMcq(topic: string): Mcq {
  const t = topic || "the core concept";
  return {
    text: `Which of the following best describes ${t}?`,
    optionA: `The correct explanation of ${t}`,
    optionB: `A common misconception about ${t}`,
    optionC: "An unrelated concept",
    optionD: "None of the above",
    correctOption: "A",
  };
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
  const isMcq = body.kind === "mcq";

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
              content: isMcq
                ? "You are a quiz author inside a school portal. You always reply with valid JSON only, no markdown."
                : "You are a writing assistant inside a school portal. You write short, practical, plain-text content for teachers. Never add greetings, signatures, or markdown formatting.",
            },
            {
              role: "user",
              content: `${INSTRUCTIONS[body.kind]}\n\n${contextParts.join("\n") || "Use a sensible generic topic."}`,
            },
          ],
          temperature: isMcq ? 0.8 : 0.7,
          max_tokens: isMcq ? 500 : 350,
          ...(isMcq ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content: string | undefined = data?.choices?.[0]?.message?.content;
        if (isMcq && content) {
          try {
            const cleaned = content
              .trim()
              .replace(/^```(?:json)?/i, "")
              .replace(/```$/, "")
              .trim();
            const mcq = Mcq.parse(JSON.parse(cleaned));
            return NextResponse.json({ mcq });
          } catch {
            /* fall through to template */
          }
        } else if (!isMcq && content?.trim()) {
          return NextResponse.json({ text: content.trim() });
        }
      }
    } catch {
      /* fall through to template */
    }
  }

  if (isMcq) {
    return NextResponse.json({ mcq: templateMcq(seed || title) });
  }
  return NextResponse.json({
    text: templateText(body.kind as Exclude<Kind, "mcq">, title, course),
  });
}
