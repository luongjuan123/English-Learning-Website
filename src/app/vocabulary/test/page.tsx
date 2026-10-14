import React from "react";
import { prisma } from "@/lib/db";
import { VocabTestClient, VocabTestWord } from "./VocabTestClient";

export const dynamic = "force-dynamic";

export default async function VocabTestPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  const words = await prisma.vocabularyWord.findMany({
    include: {
      userVocabularies: {
        where: { userId },
      },
    },
  });

  const formatted: VocabTestWord[] = words.map((w) => ({
    id: w.userVocabularies[0]?.id || w.id,
    word: w.word,
    phonetic: w.phonetic,
    pos: w.pos,
    defEn: w.defEn,
    defVn: w.defVn,
    exampleEn: w.exampleEn,
    exampleVn: w.exampleVn,
    cefrLevel: w.cefrLevel,
    topic: w.topic,
    status: w.userVocabularies[0]?.status || "new",
  }));

  return <VocabTestClient allWords={formatted} />;
}
