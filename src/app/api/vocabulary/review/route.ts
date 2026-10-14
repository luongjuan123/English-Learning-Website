import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateSM2 } from "@/lib/sm2";
import { z } from "zod";

const ReviewSchema = z.object({
  userVocabId: z.string(),
  rating: z.number().min(0).max(5), // SM-2 rating 0-5
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userVocabId, rating } = ReviewSchema.parse(body);

    const userVocab = await prisma.userVocabulary.findUnique({
      where: { id: userVocabId },
    });

    if (!userVocab) {
      return NextResponse.json({ error: "Vocabulary record not found" }, { status: 404 });
    }

    // Compute next SM-2 interval
    const sm2Result = calculateSM2({
      quality: rating,
      repetitions: userVocab.repetitions,
      easeFactor: userVocab.easeFactor,
      intervalDays: userVocab.intervalDays,
    });

    const isCorrect = rating >= 3;

    // Update UserVocabulary
    const updated = await prisma.userVocabulary.update({
      where: { id: userVocabId },
      data: {
        status: sm2Result.status,
        intervalDays: sm2Result.intervalDays,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedAt: new Date(),
        timesCorrect: isCorrect ? userVocab.timesCorrect + 1 : userVocab.timesCorrect,
        timesIncorrect: !isCorrect ? userVocab.timesIncorrect + 1 : userVocab.timesIncorrect,
      },
    });

    // Log review attempt
    await prisma.reviewAttempt.create({
      data: {
        userVocabularyId: userVocabId,
        rating,
        intervalDays: sm2Result.intervalDays,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, updated, sm2Result });
  } catch (error: any) {
    console.error("Vocabulary review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process review" },
      { status: 400 }
    );
  }
}
