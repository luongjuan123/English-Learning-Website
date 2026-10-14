/**
 * Deterministic Test Grading Engine
 */

export interface QuestionToGrade {
  id: string;
  type: string; // 'mcq', 'fill_blank', 'sentence_order', 'error_identify', 'short_answer'
  correctAnswer: string;
  topic?: string;
  explanation?: string | null;
}

export interface QuestionGradingResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface TestGradingSummary {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  results: QuestionGradingResult[];
  weakTopics: string[];
}

/**
 * Normalizes text for comparison by trimming, lowercasing, and normalizing spaces
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Checks if a user's answer matches the correct answer
 */
export function checkAnswer(
  type: string,
  userAnswer: string | null | undefined,
  correctAnswer: string
): boolean {
  if (!userAnswer || userAnswer.trim() === "") {
    return false; // Unanswered question is NEVER correct
  }

  const uRaw = userAnswer.trim();
  const cRaw = correctAnswer.trim();

  if (type === "mcq" || type === "error_identify") {
    return uRaw.toLowerCase() === cRaw.toLowerCase();
  }

  if (type === "fill_blank" || type === "short_answer") {
    // If correct answer contains alternatives like "doesn't / does not"
    const alternatives = cRaw
      .split("/")
      .map((alt) => normalizeText(alt));
    const userNormalized = normalizeText(uRaw);
    return alternatives.includes(userNormalized);
  }

  if (type === "sentence_order") {
    return normalizeText(uRaw) === normalizeText(cRaw);
  }

  // Fallback
  return normalizeText(uRaw) === normalizeText(cRaw);
}

/**
 * Grades an entire set of test answers
 */
export function gradeTest(
  questions: QuestionToGrade[],
  userAnswers: Record<string, string>,
  passingScorePercent = 70
): TestGradingSummary {
  const results: QuestionGradingResult[] = [];
  const weakTopicCount: Record<string, number> = {};
  let score = 0;

  for (const q of questions) {
    const rawUserAnswer = userAnswers[q.id] || "";
    const isCorrect = checkAnswer(q.type, rawUserAnswer, q.correctAnswer);

    if (isCorrect) {
      score += 1;
    } else {
      const topic = q.topic || "General Grammar";
      weakTopicCount[topic] = (weakTopicCount[topic] || 0) + 1;
    }

    results.push({
      questionId: q.id,
      isCorrect,
      userAnswer: rawUserAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "Review the lesson materials for this topic.",
      topic: q.topic || "General",
    });
  }

  const maxScore = questions.length;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentage >= passingScorePercent;

  // Weak topics sorted by mistake count
  const weakTopics = Object.entries(weakTopicCount)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return {
    score,
    maxScore,
    percentage,
    passed,
    results,
    weakTopics,
  };
}
