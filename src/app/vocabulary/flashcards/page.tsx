import React from "react";
import { prisma } from "@/lib/db";
import { FlashcardClient } from "./FlashcardClient";

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  const now = new Date();

  // 1. Fetch due cards first
  const dueUserVocabs = await prisma.userVocabulary.findMany({
    where: {
      userId,
      nextReviewDate: { lte: now },
    },
    include: { word: true },
    orderBy: { nextReviewDate: "asc" },
  });

  let cards = dueUserVocabs.map((uv) => ({
    userVocabId: uv.id,
    word: uv.word.word,
    phonetic: uv.word.phonetic,
    pos: uv.word.pos,
    defEn: uv.word.defEn,
    defVn: uv.word.defVn,
    exampleEn: uv.word.exampleEn,
    exampleVn: uv.word.exampleVn,
    cefrLevel: uv.word.cefrLevel,
    collocations: uv.word.collocations,
    synonyms: uv.word.synonyms,
    status: uv.status,
    intervalDays: uv.intervalDays,
    repetitions: uv.repetitions,
  }));

  // If fewer than 5 cards are strictly due, top up with other unmastered cards
  if (cards.length < 5) {
    const existingIds = new Set(cards.map((c) => c.userVocabId));
    const extraVocabs = await prisma.userVocabulary.findMany({
      where: {
        userId,
        status: { in: ["new", "learning", "familiar"] },
        id: { notIn: Array.from(existingIds) },
      },
      include: { word: true },
      take: 10 - cards.length,
    });

    const extraCards = extraVocabs.map((uv) => ({
      userVocabId: uv.id,
      word: uv.word.word,
      phonetic: uv.word.phonetic,
      pos: uv.word.pos,
      defEn: uv.word.defEn,
      defVn: uv.word.defVn,
      exampleEn: uv.word.exampleEn,
      exampleVn: uv.word.exampleVn,
      cefrLevel: uv.word.cefrLevel,
      collocations: uv.word.collocations,
      synonyms: uv.word.synonyms,
      status: uv.status,
      intervalDays: uv.intervalDays,
      repetitions: uv.repetitions,
    }));

    cards = [...cards, ...extraCards];
  }

  const allCount = await prisma.userVocabulary.count({ where: { userId } });

  return <FlashcardClient cards={cards} allCount={allCount} />;
}
