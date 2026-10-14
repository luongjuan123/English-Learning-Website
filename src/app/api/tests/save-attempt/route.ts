import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const AttemptSchema = z.object({
  testId: z.string().optional(),
  testTitle: z.string().default("Custom Test"),
  category: z.string().default("general"),
  cefrLevel: z.string().default("mixed"),
  score: z.number(),
  maxScore: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  answers: z.record(z.any()),
  feedback: z.any().optional(),
  weakTopics: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = AttemptSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    let testId = data.testId;

    if (!testId) {
      // Find or create test record
      const existing = await prisma.test.findFirst({
        where: { title: data.testTitle },
      });
      if (existing) {
        testId = existing.id;
      } else {
        const created = await prisma.test.create({
          data: {
            title: data.testTitle,
            category: data.category,
            cefrLevel: data.cefrLevel,
            timeLimitMinutes: 15,
            passingScore: 70,
            isCustom: true,
          },
        });
        testId = created.id;
      }
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId,
        score: data.score,
        maxScore: data.maxScore,
        percentage: data.percentage,
        passed: data.passed,
        answersJson: JSON.stringify(data.answers),
        feedbackJson: data.feedback ? JSON.stringify(data.feedback) : null,
        weakTopicsJson: data.weakTopics ? JSON.stringify(data.weakTopics) : null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error: any) {
    console.error("Save attempt error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save attempt" },
      { status: 400 }
    );
  }
}
