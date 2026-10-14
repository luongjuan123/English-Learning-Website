import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GeneratedLessonSchema } from "@/lib/ai/schemas";
import { z } from "zod";

const SaveRequestSchema = z.object({
  levelId: z.enum(["A1", "A2", "B1", "B2"]),
  chapterId: z.string().optional(),
  newChapterTitle: z.string().optional(),
  lesson: GeneratedLessonSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SaveRequestSchema.parse(body);

    let targetChapterId = data.chapterId;

    // If no existing chapter selected or new chapter requested
    if (!targetChapterId || targetChapterId === "new") {
      const chapterTitle = data.newChapterTitle?.trim() || "Custom AI Topics";
      const existingChaptersCount = await prisma.chapter.count({
        where: { levelId: data.levelId },
      });

      const newChapter = await prisma.chapter.create({
        data: {
          levelId: data.levelId,
          title: chapterTitle,
          orderIndex: existingChaptersCount + 1,
        },
      });
      targetChapterId = newChapter.id;
    }

    // Get order index for new lesson
    const existingLessonsCount = await prisma.lesson.count({
      where: { chapterId: targetChapterId },
    });

    const slug = data.lesson.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create Lesson with exercises
    const createdLesson = await prisma.lesson.create({
      data: {
        chapterId: targetChapterId,
        title: data.lesson.title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        objectives: JSON.stringify(data.lesson.objectives),
        grammarExplanation: data.lesson.grammarExplanation,
        vietnameseNotes: data.lesson.vietnameseNotes,
        readingPassage: data.lesson.readingPassage,
        readingPassageVn: data.lesson.readingPassageVn,
        listeningScript: data.lesson.listeningScript,
        summary: data.lesson.summary,
        orderIndex: existingLessonsCount + 1,
        isCustomGenerated: true,
        exercises: {
          create: data.lesson.exercises.map((ex, idx) => ({
            type: ex.type,
            prompt: ex.prompt,
            promptVn: ex.promptVn,
            optionsJson: ex.options ? JSON.stringify(ex.options) : null,
            answer: ex.answer,
            explanation: ex.explanation,
            orderIndex: idx + 1,
          })),
        },
      },
    });

    // Also persist vocabulary words to database vocabulary bank
    for (const v of data.lesson.vocabulary) {
      await prisma.vocabularyWord.upsert({
        where: { word: v.word.toLowerCase().trim() },
        update: {
          defVn: v.defVn,
          defEn: v.defEn,
          phonetic: v.phonetic,
          exampleEn: v.exampleEn,
          exampleVn: v.exampleVn,
          cefrLevel: data.levelId,
        },
        create: {
          word: v.word.toLowerCase().trim(),
          phonetic: v.phonetic,
          pos: v.pos,
          defEn: v.defEn,
          defVn: v.defVn,
          exampleEn: v.exampleEn,
          exampleVn: v.exampleVn,
          cefrLevel: data.levelId,
          topic: "AI Lesson Vocab",
        },
      });
    }

    return NextResponse.json({ success: true, lessonId: createdLesson.id });
  } catch (error: any) {
    console.error("Save generated lesson error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save generated lesson" },
      { status: 400 }
    );
  }
}
