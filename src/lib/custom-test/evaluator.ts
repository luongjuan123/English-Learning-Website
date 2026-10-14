import { prisma } from "@/lib/db";
import { ServerQuestion } from "./generator";
import { calculateSM2 } from "@/lib/sm2";

export interface EvaluatedQuestionResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  targetWord: string;
  exampleEn?: string;
  exampleVn?: string;
}

export interface CustomTestEvaluationSummary {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  results: EvaluatedQuestionResult[];
  missedWords: string[];
}

/**
 * Normalizes text for strict, accurate answer verification:
 * - Normalizes Unicode to NFC
 * - Trims and lowercases
 * - Strips leading/trailing punctuation and quotation marks
 * - Collapses consecutive spaces
 */
export function normalizeAnswer(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/^["'“”‘’.,;:!?()\[\]{}]+|["'“”‘’.,;:!?()\[\]{}]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether user answer matches the correct answer or accepted alternatives.
 * Avoids false-positive substring matches (e.g. "cat" does NOT match "caterpillar").
 */
export function evaluateAnswer(
  type: string,
  userAnswer: string | null | undefined,
  correctAnswer: string,
  acceptedAnswers?: string[]
): boolean {
  if (!userAnswer || userAnswer.trim() === "") {
    return false; // Unanswered question is NEVER correct
  }

  const uNorm = normalizeAnswer(userAnswer);
  const cNorm = normalizeAnswer(correctAnswer);

  if (uNorm === cNorm) {
    return true;
  }

  // Check alternative accepted answers if provided
  if (acceptedAnswers && acceptedAnswers.length > 0) {
    for (const alt of acceptedAnswers) {
      if (uNorm === normalizeAnswer(alt)) {
        return true;
      }
    }
  }

  // Support slash-separated options in correctAnswer (e.g., "doesn't / does not")
  if (correctAnswer.includes("/")) {
    const slashes = correctAnswer.split("/").map((s) => normalizeAnswer(s));
    if (slashes.includes(uNorm)) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates all submitted answers against server-side secret questions
 */
export async function evaluateCustomTest(
  serverQuestions: ServerQuestion[],
  userAnswers: Record<string, string>,
  userId: string,
  passingScorePercent = 70
): Promise<CustomTestEvaluationSummary> {
  let score = 0;
  const results: EvaluatedQuestionResult[] = [];
  const missedWordsSet = new Set<string>();
  const testedWordsStatus = new Map<string, boolean>();

  for (const sq of serverQuestions) {
    const rawAnswer = userAnswers[sq.id] || "";
    const isCorrect = evaluateAnswer(
      sq.type,
      rawAnswer,
      sq.correctAnswer,
      sq.acceptedAnswers
    );

    if (isCorrect) {
      score += 1;
      if (!testedWordsStatus.has(sq.targetWord.toLowerCase())) {
        testedWordsStatus.set(sq.targetWord.toLowerCase(), true);
      }
    } else {
      missedWordsSet.add(sq.targetWord);
      testedWordsStatus.set(sq.targetWord.toLowerCase(), false);
    }

    results.push({
      questionId: sq.id,
      isCorrect,
      userAnswer: rawAnswer,
      correctAnswer: sq.correctAnswer,
      explanation: sq.explanation,
      targetWord: sq.targetWord,
      exampleEn: sq.exampleEn,
      exampleVn: sq.exampleVn,
    });
  }

  const maxScore = serverQuestions.length;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentage >= passingScorePercent;
  const missedWords = Array.from(missedWordsSet);

  // Update spaced repetition status in database for tested words
  try {
    for (const [lowerWord, isCorrect] of testedWordsStatus.entries()) {
      const vocabRecord = await prisma.vocabularyWord.findUnique({
        where: { word: lowerWord },
      });

      if (vocabRecord) {
        const userVocab = await prisma.userVocabulary.findUnique({
          where: {
            userId_wordId: {
              userId,
              wordId: vocabRecord.id,
            },
          },
        });

        if (userVocab) {
          // Quality rating: 4 if correct, 1 if missed
          const quality = isCorrect ? 4 : 1;
          const sm2 = calculateSM2({
            quality,
            repetitions: userVocab.repetitions,
            easeFactor: userVocab.easeFactor,
            intervalDays: userVocab.intervalDays,
          });

          await prisma.userVocabulary.update({
            where: { id: userVocab.id },
            data: {
              status: sm2.status,
              intervalDays: sm2.intervalDays,
              easeFactor: sm2.easeFactor,
              repetitions: sm2.repetitions,
              nextReviewDate: sm2.nextReviewDate,
              lastReviewedAt: new Date(),
              timesCorrect: isCorrect ? userVocab.timesCorrect + 1 : userVocab.timesCorrect,
              timesIncorrect: !isCorrect ? userVocab.timesIncorrect + 1 : userVocab.timesIncorrect,
            },
          });

          await prisma.reviewAttempt.create({
            data: {
              userVocabularyId: userVocab.id,
              rating: quality,
              intervalDays: sm2.intervalDays,
              reviewedAt: new Date(),
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Failed to update spaced repetition during custom test evaluation:", err);
  }

  return {
    score,
    maxScore,
    percentage,
    passed,
    results,
    missedWords,
  };
}
