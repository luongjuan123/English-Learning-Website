import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const SaveVocabSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().optional(),
  pos: z.string().default("word"),
  defEn: z.string().min(1),
  defVn: z.string().min(1),
  exampleEn: z.string().optional().default(""),
  exampleVn: z.string().optional().default(""),
  cefrLevel: z.string().default("A1"),
  topic: z.string().default("General"),
  synonyms: z.string().optional(),
  collocations: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SaveVocabSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    // 1. Create or get vocabulary word
    const vocabWord = await prisma.vocabularyWord.upsert({
      where: { word: data.word.toLowerCase().trim() },
      update: {
        defVn: data.defVn,
        defEn: data.defEn,
        phonetic: data.phonetic || undefined,
        exampleEn: data.exampleEn || undefined,
        exampleVn: data.exampleVn || undefined,
      },
      create: {
        word: data.word.toLowerCase().trim(),
        phonetic: data.phonetic,
        pos: data.pos,
        defEn: data.defEn,
        defVn: data.defVn,
        exampleEn: data.exampleEn,
        exampleVn: data.exampleVn,
        cefrLevel: data.cefrLevel,
        topic: data.topic,
        synonyms: data.synonyms,
        collocations: data.collocations,
      },
    });

    // 2. Link to user vocabulary with initial spaced repetition settings
    const userVocab = await prisma.userVocabulary.upsert({
      where: {
        userId_wordId: {
          userId,
          wordId: vocabWord.id,
        },
      },
      update: {},
      create: {
        userId,
        wordId: vocabWord.id,
        status: "new",
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, word: vocabWord, userVocab });
  } catch (error: any) {
    console.error("Vocabulary save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save vocabulary" },
      { status: 400 }
    );
  }
}
