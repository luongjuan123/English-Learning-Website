import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vocabWords = await prisma.vocabularyWord.findMany({
      orderBy: { word: "asc" },
    });

    const levels = await prisma.level.findMany({
      include: {
        chapters: {
          include: {
            lessons: {
              include: {
                exercises: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      vocabularyWords: vocabWords,
      curriculum: levels,
    });
  } catch (error: any) {
    console.error("Export data error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
