import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ProgressSchema = z.object({
  lessonId: z.string(),
  quizScore: z.number().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId, quizScore, status } = ProgressSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        status,
        quizScore: quizScore !== undefined ? quizScore : undefined,
        completedAt: status === "completed" ? new Date() : undefined,
        lastStudiedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status,
        quizScore: quizScore || 0,
        completedAt: status === "completed" ? new Date() : null,
        lastStudiedAt: new Date(),
      },
    });

    // Also update user's lastActiveDate and streak if needed
    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastDate = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      let newStreak = user.streakDays;

      if (lastDate) {
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round(
          (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
        );

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveDate: new Date(),
          streakDays: newStreak,
        },
      });
    }

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error("Progress save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save lesson progress" },
      { status: 400 }
    );
  }
}
