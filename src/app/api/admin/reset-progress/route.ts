import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ResetSchema = z.object({
  target: z.enum(["test_attempts", "lesson_progress", "all_progress"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = ResetSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    if (target === "test_attempts" || target === "all_progress") {
      await prisma.testAttempt.deleteMany({
        where: { userId },
      });
    }

    if (target === "lesson_progress" || target === "all_progress") {
      await prisma.lessonProgress.deleteMany({
        where: { userId },
      });
      // Reset streak
      await prisma.user.updateMany({
        where: { id: userId },
        data: { streakDays: 0, currentCefr: "A1" },
      });
    }

    return NextResponse.json({ success: true, message: `Reset ${target} successfully` });
  } catch (error: any) {
    console.error("Reset progress error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset progress" },
      { status: 400 }
    );
  }
}
