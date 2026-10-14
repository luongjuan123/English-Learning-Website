import { NextRequest, NextResponse } from "next/server";
import { generateLessonWithAI } from "@/lib/ai/client";
import { z } from "zod";

const RequestSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2"]),
  topic: z.string().min(2).max(120),
  lessonType: z.enum([
    "grammar",
    "vocabulary",
    "reading",
    "writing",
    "listening",
    "speaking",
    "mixed",
  ]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  length: z.enum(["short", "standard", "comprehensive"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = RequestSchema.parse(body);

    const result = await generateLessonWithAI(params);

    return NextResponse.json({
      success: true,
      lesson: result.lesson,
      isFallback: result.isFallback,
    });
  } catch (error: any) {
    console.error("AI lesson generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate lesson" },
      { status: 400 }
    );
  }
}
