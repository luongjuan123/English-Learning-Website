/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 */

export interface SM2Input {
  quality: number; // 0 to 5
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: Date;
  status: "new" | "learning" | "familiar" | "mastered";
}

export function calculateSM2({
  quality,
  repetitions,
  easeFactor,
  intervalDays,
}: SM2Input): SM2Output {
  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextInterval = intervalDays;

  if (q >= 3) {
    // Correct recall
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    nextRepetitions = repetitions + 1;
  } else {
    // Incorrect recall (reset repetitions and interval)
    nextRepetitions = 0;
    nextInterval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  nextEaseFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  // Determine status based on repetitions and ease
  let status: "new" | "learning" | "familiar" | "mastered" = "learning";
  if (nextRepetitions === 0) {
    status = "new";
  } else if (nextRepetitions >= 5 && q >= 4) {
    status = "mastered";
  } else if (nextRepetitions >= 3) {
    status = "familiar";
  } else {
    status = "learning";
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    repetitions: nextRepetitions,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    intervalDays: nextInterval,
    nextReviewDate,
    status,
  };
}
