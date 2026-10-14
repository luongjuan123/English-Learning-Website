import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseWordList } from "@/lib/custom-test/parser";
import { generateCustomTest, TestConfig } from "@/lib/custom-test/generator";
import { z } from "zod";

const GenerateRequestSchema = z.object({
  rawWords: z.string().optional(),
  words: z.array(z.string()).optional(),
  title: z.string().optional(),
  saveList: z.boolean().optional(),
  listName: z.string().optional(),
  config: z.object({
    questionType: z.enum([
      "en_to_vn",
      "vn_to_en",
      "vocab_mcq",
      "fill_blank",
      "complete_sentence",
      "matching",
      "type_answer",
      "mixed",
    ]),
    questionCount: z.number().min(1).max(100),
    difficulty: z.enum(["easy", "medium", "hard", "auto"]),
    language: z.enum(["en", "vi"]),
    timeLimitMinutes: z.number().min(0).max(120),
    shuffle: z.boolean(),
    showHints: z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = GenerateRequestSchema.parse(body);

    const user = await prisma.user.findFirst();
    const userId = user?.id || "default-student";

    // Parse words deterministically
    let finalWords: string[] = [];
    if (data.words && data.words.length > 0) {
      finalWords = parseWordList(data.words.join("\n")).words;
    } else if (data.rawWords) {
      finalWords = parseWordList(data.rawWords).words;
    }

    if (finalWords.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one valid word or phrase." },
        { status: 400 }
      );
    }

    // Optionally save the word list for future use
    if (data.saveList && data.listName && data.listName.trim() !== "") {
      await prisma.savedWordList.create({
        data: {
          userId,
          name: data.listName.trim(),
          wordsJson: JSON.stringify(finalWords),
        },
      });
    }

    // Generate test
    const { serverQuestions, clientQuestions } = await generateCustomTest(
      finalWords,
      data.config as TestConfig
    );

    const testTitle =
      data.title?.trim() ||
      (data.listName?.trim()
        ? `Vocabulary Test: ${data.listName.trim()}`
        : `Custom Vocabulary Test (${finalWords.length} words)`);

    // Create session in database with secret answer keys on the server
    const session = await prisma.customTestSession.create({
      data: {
        userId,
        title: testTitle,
        configJson: JSON.stringify(data.config),
        questionsJson: JSON.stringify(serverQuestions),
        clientQuestionsJson: JSON.stringify(clientQuestions),
        status: "active",
      },
    });

    // Deliver sanitized questions to client (NO answers or explanations exposed!)
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      title: testTitle,
      config: data.config,
      questions: clientQuestions,
      totalQuestions: clientQuestions.length,
      availableWordsCount: finalWords.length,
    });
  } catch (error: any) {
    console.error("Custom test generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate custom test" },
      { status: 400 }
    );
  }
}
