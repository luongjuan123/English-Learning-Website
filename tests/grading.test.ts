import { describe, it, expect } from "vitest";
import { checkAnswer, gradeTest, normalizeText } from "@/lib/grading";

describe("Test Grading Engine", () => {
  it("should normalize text by trimming, lowercasing, and removing punctuation", () => {
    expect(normalizeText("  Hello, World! ")).toBe("hello world");
    expect(normalizeText("She doesn't like milk.")).toBe("she doesnt like milk");
  });

  it("should accept case-insensitive and trimmed answers for MCQ", () => {
    expect(checkAnswer("mcq", "She", "she")).toBe(true);
    expect(checkAnswer("mcq", "  are ", "are")).toBe(true);
    expect(checkAnswer("mcq", "is", "are")).toBe(false);
  });

  it("should never count empty or unanswered questions as correct", () => {
    expect(checkAnswer("mcq", "", "are")).toBe(false);
    expect(checkAnswer("mcq", "   ", "are")).toBe(false);
    expect(checkAnswer("fill_blank", undefined, "see")).toBe(false);
  });

  it("should support slash-separated alternative answers for fill-in-the-blank", () => {
    expect(checkAnswer("fill_blank", "doesn't", "does not / doesn't")).toBe(true);
    expect(checkAnswer("fill_blank", "does not", "does not / doesn't")).toBe(true);
    expect(checkAnswer("fill_blank", "did not", "does not / doesn't")).toBe(false);
  });

  it("should correctly verify sentence ordering ignoring extra spacing and punctuation", () => {
    const correct = "We are good friends.";
    const user = "We are good friends";
    expect(checkAnswer("sentence_order", user, correct)).toBe(true);

    const incorrect = "Friends we are good";
    expect(checkAnswer("sentence_order", incorrect, correct)).toBe(false);
  });

  it("should grade a complete test, calculate percentages, and sort weak topics", () => {
    const questions = [
      {
        id: "q1",
        type: "mcq",
        correctAnswer: "are",
        topic: "Verb To Be",
      },
      {
        id: "q2",
        type: "fill_blank",
        correctAnswer: "meet",
        topic: "Greetings",
      },
      {
        id: "q3",
        type: "mcq",
        correctAnswer: "bought",
        topic: "Past Simple",
      },
      {
        id: "q4",
        type: "mcq",
        correctAnswer: "had",
        topic: "Conditionals",
      },
    ];

    const userAnswers = {
      q1: "are", // correct
      q2: "meet", // correct
      q3: "buyed", // incorrect (Past Simple)
      q4: "have", // incorrect (Conditionals)
    };

    const result = gradeTest(questions, userAnswers, 70);

    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(4);
    expect(result.percentage).toBe(50);
    expect(result.passed).toBe(false);
    expect(result.weakTopics).toContain("Past Simple");
    expect(result.weakTopics).toContain("Conditionals");
  });
});
