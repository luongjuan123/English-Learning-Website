import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateCustomTest } from "@/lib/custom-test/evaluator";
import { ServerQuestion } from "@/lib/custom-test/generator";
import { z } from "zod";

const SubmitSchema = z.object({
  sessionId: z.string(),
  answers: z.record(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, answers } = SubmitSchema.parse(body);

    const session = await prisma.customTestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Test session not found" }, { status: 404 });
    }

    const serverQuestions: ServerQuestion[] = JSON.parse(session.questionsJson);

    // Evaluate answers securely on server
    const evaluation = await evaluateCustomTest(
      serverQuestions,
      answers,
      session.userId,
      70
    );

    // Update custom test session
    await prisma.customTestSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        answersJson: JSON.stringify(answers),
        resultsJson: JSON.stringify(evaluation.results),
        missedWordsJson: JSON.stringify(evaluation.missedWords),
        completedAt: new Date(),
      },
    });

    // Also record into TestAttempt so it connects to test history and progress analytics
    try {
      let testRecord = await prisma.test.findFirst({
        where: { title: session.title },
      });
      if (!testRecord) {
        testRecord = await prisma.test.create({
          data: {
            title: session.title,
            category: "custom_vocabulary",
            cefrLevel: "mixed",
            timeLimitMinutes: 15,
            passingScore: 70,
            isCustom: true,
          },
        });
      }

      await prisma.testAttempt.create({
        data: {
          testId: testRecord.id,
          userId: session.userId,
          score: evaluation.score,
          maxScore: evaluation.maxScore,
          percentage: evaluation.percentage,
          passed: evaluation.passed,
          answersJson: JSON.stringify(answers),
          feedbackJson: JSON.stringify(evaluation.results),
          weakTopicsJson: JSON.stringify(evaluation.missedWords),
          completedAt: new Date(),
        },
      });
    } catch (err) {
      console.warn("Could not mirror attempt into TestAttempt:", err);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      results: evaluation.results,
      missedWords: evaluation.missedWords,
    });
  } catch (error: any) {
    console.error("Custom test submit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit custom test" },
      { status: 400 }
    );
  }
}
