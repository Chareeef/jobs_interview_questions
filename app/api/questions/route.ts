import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `You are an expert interviewer who designs thoughtful, role-specific interview questions.

For the job title you receive, generate exactly 3 interview questions following this structure:
1. One BEHAVIORAL question (probes a past experience relevant to this role)
2. One SITUATIONAL question (presents a realistic scenario the person would face in this role)
3. One SKILL/COMPETENCY question (probes a specific capability central to this role)

Each question should be 1-2 sentences, direct, and clearly tied to the actual work of the role. Avoid generic filler like "tell me about yourself" or "what are your weaknesses".

Return ONLY valid JSON in this exact shape, with no prose before or after:
{"questions": ["question 1", "question 2", "question 3"]}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";

    if (!jobTitle) {
      return NextResponse.json(
        { error: "jobTitle is required" },
        { status: 400 }
      );
    }

    if (jobTitle.length > 200) {
      return NextResponse.json(
        { error: "jobTitle is too long (max 200 chars)" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Server is not configured (missing API key)" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate 3 interview questions for the role: "${jobTitle}".`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI returned no text content" },
        { status: 502 }
      );
    }

    const parsed = parseQuestions(textBlock.text);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI returned malformed output. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions: parsed });
  } catch (err) {
    console.error("API error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseQuestions(raw: string): string[] | null {
  // Strip code fences if the model wraps JSON in ```json ... ```
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const obj = JSON.parse(cleaned);
    if (
      obj &&
      Array.isArray(obj.questions) &&
      obj.questions.length === 3 &&
      obj.questions.every((q: unknown) => typeof q === "string" && q.trim().length > 0)
    ) {
      return obj.questions.map((q: string) => q.trim());
    }
    return null;
  } catch {
    return null;
  }
}
