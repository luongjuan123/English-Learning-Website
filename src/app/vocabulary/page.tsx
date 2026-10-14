import React from "react";
import { prisma } from "@/lib/db";
import { VocabularyClient, VocabItem } from "./VocabularyClient";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  // Fetch all user vocabularies or all vocabulary words joined
  const words = await prisma.vocabularyWord.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userVocabularies: {
        where: { userId },
      },
    },
  });

  const formattedWords: VocabItem[] = words.map((w) => {
    const uv = w.userVocabularies[0];
    return {
      id: uv?.id || `unlinked-${w.id}`,
      wordId: w.id,
      word: w.word,
      phonetic: w.phonetic,
      pos: w.pos,
      defEn: w.defEn,
      defVn: w.defVn,
      exampleEn: w.exampleEn,
      exampleVn: w.exampleVn,
      cefrLevel: w.cefrLevel,
      topic: w.topic,
      synonyms: w.synonyms,
      collocations: w.collocations,
      status: uv?.status || "new",
      repetitions: uv?.repetitions || 0,
      intervalDays: uv?.intervalDays || 0,
      nextReviewDate: uv?.nextReviewDate?.toISOString() || new Date().toISOString(),
    };
  });

  return <VocabularyClient initialWords={formattedWords} />;
}
