import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await prisma.customTestSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Test session not found" }, { status: 404 });
    }

    const config = JSON.parse(session.configJson);

    if (session.status === "completed") {
      return NextResponse.json({
        sessionId: session.id,
        title: session.title,
        status: "completed",
        config,
        score: session.score,
        maxScore: session.maxScore,
        percentage: session.percentage,
        passed: session.passed,
        results: session.resultsJson ? JSON.parse(session.resultsJson) : [],
        missedWords: session.missedWordsJson ? JSON.parse(session.missedWordsJson) : [],
        completedAt: session.completedAt,
      });
    }

    // Active session: return sanitized questions only
    const clientQuestions = JSON.parse(session.clientQuestionsJson);
    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
      status: "active",
      config,
      questions: clientQuestions,
      totalQuestions: clientQuestions.length,
    });
  } catch (error: any) {
    console.error("Fetch session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
