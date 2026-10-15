import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

async function getUserId() {
  const user = await prisma.user.findFirst();
  return user?.id ?? "default-student";
}

const EnrichedWordSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().optional().default(""),
  pos: z.string().optional().default("word"),
  defEn: z.string().optional().default(""),
  defVn: z.string().min(1),
  exampleEn: z.string().optional().default(""),
  exampleVn: z.string().optional().default(""),
  cefrEstimate: z.string().optional().default("A2"),
  synonyms: z.array(z.string()).optional().default([]),
  collocations: z.array(z.string()).optional().default([]),
  usageNote: z.string().optional().default(""),
});

const SaveCollectionSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "auto"]).optional().default("auto"),
  enrichedWords: z.array(EnrichedWordSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SaveCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const userId = await getUserId();
    const { name, description, cefrLevel, enrichedWords } = parsed.data;

    const wordsList = enrichedWords.map((w) => w.word);

    // 1. Create or update the SavedWordList collection
    const savedList = await prisma.savedWordList.create({
      data: {
        userId,
        name,
        description: description || `Custom collection containing ${enrichedWords.length} words.`,
        wordsJson: JSON.stringify(wordsList),
      },
    });

    // 2. Persist individual vocabulary words and link them to UserVocabulary for SRS flashcards
    for (const item of enrichedWords) {
      const lower = item.word.toLowerCase().trim();
      const level =
        item.cefrEstimate && item.cefrEstimate !== "auto"
          ? item.cefrEstimate
          : cefrLevel === "auto"
          ? "A2"
          : cefrLevel;

      try {
        const vocabWord = await prisma.vocabularyWord.upsert({
          where: { word: lower },
          update: {
            phonetic: item.ipa || undefined,
            pos: item.pos || "word",
            defEn: item.defEn || `Definition for ${item.word}`,
            defVn: item.defVn,
            exampleEn: item.exampleEn || "",
            exampleVn: item.exampleVn || "",
            synonyms: item.synonyms.length > 0 ? item.synonyms.join(", ") : undefined,
            collocations: item.collocations.length > 0 ? item.collocations.join(", ") : undefined,
          },
          create: {
            word: lower,
            phonetic: item.ipa || "",
            pos: item.pos || "word",
            defEn: item.defEn || `Definition for ${item.word}`,
            defVn: item.defVn,
            exampleEn: item.exampleEn || "",
            exampleVn: item.exampleVn || "",
            cefrLevel: level,
            topic: name,
            synonyms: item.synonyms.length > 0 ? item.synonyms.join(", ") : null,
            collocations: item.collocations.length > 0 ? item.collocations.join(", ") : null,
          },
        });

        // Ensure user has this word in their SRS list
        await prisma.userVocabulary.upsert({
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
            repetitions: 0,
            easeFactor: 2.5,
            nextReviewDate: new Date(),
          },
        });
      } catch (err) {
        console.warn(`Could not save word ${lower}:`, err);
      }
    }

    return NextResponse.json({
      collection: {
        ...savedList,
        words: wordsList,
      },
      savedCount: enrichedWords.length,
    });
  } catch (err) {
    console.error("Save custom vocab error:", err);
    return NextResponse.json({ error: "Failed to save collection" }, { status: 500 });
  }
}
