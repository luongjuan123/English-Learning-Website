import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vocabularyWords } = body;

    let importedCount = 0;

    if (Array.isArray(vocabularyWords)) {
      for (const w of vocabularyWords) {
        if (!w.word || !w.defVn) continue;
        await prisma.vocabularyWord.upsert({
          where: { word: w.word.toLowerCase().trim() },
          update: {
            defVn: w.defVn,
            defEn: w.defEn || "",
            phonetic: w.phonetic,
            exampleEn: w.exampleEn || "",
            exampleVn: w.exampleVn || "",
            cefrLevel: w.cefrLevel || "A1",
            topic: w.topic || "General",
            synonyms: w.synonyms,
            collocations: w.collocations,
          },
          create: {
            word: w.word.toLowerCase().trim(),
            phonetic: w.phonetic,
            pos: w.pos || "word",
            defEn: w.defEn || "",
            defVn: w.defVn,
            exampleEn: w.exampleEn || "",
            exampleVn: w.exampleVn || "",
            cefrLevel: w.cefrLevel || "A1",
            topic: w.topic || "General",
            synonyms: w.synonyms,
            collocations: w.collocations,
          },
        });
        importedCount += 1;
      }
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (error: any) {
    console.error("Import data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import data" },
      { status: 400 }
    );
  }
}
