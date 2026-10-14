import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateWritingWithAI } from "@/lib/ai/client";
import { z } from "zod";

const EvaluateSchema = z.object({
  prompt: z.string().min(5),
  studentText: z.string().min(10),
  topic: z.string().optional(),
  targetLevel: z.enum(["A1", "A2", "B1", "B2"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = EvaluateSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    const { evaluation, isFallback } = await evaluateWritingWithAI({
      prompt: data.prompt,
      studentText: data.studentText,
      targetLevel: data.targetLevel,
    });

    // Save writing submission
    const submission = await prisma.writingSubmission.create({
      data: {
        userId,
        prompt: data.prompt,
        studentText: data.studentText,
        topic: data.topic,
        cefrLevel: data.targetLevel,
        feedbackJson: JSON.stringify(evaluation),
        overallScore: evaluation.overallScore,
      },
    });

    return NextResponse.json({
      success: true,
      evaluation,
      submissionId: submission.id,
      isFallback,
    });
  } catch (error: any) {
    console.error("Evaluate writing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate writing" },
      { status: 400 }
    );
  }
}
