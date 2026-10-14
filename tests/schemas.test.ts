import { describe, it, expect } from "vitest";
import { GeneratedLessonSchema, WritingEvaluationSchema } from "@/lib/ai/schemas";

describe("AI Zod Schemas Validation", () => {
  it("should validate a well-formed generated lesson", () => {
    const validLesson = {
      title: "Asking for Directions in London",
      objectives: ["Learn prepositional phrases", "Ask polite directional questions"],
      grammarExplanation: "### Prepositions of Place\nUse 'next to', 'opposite', and 'straight ahead'.",
      vietnameseNotes: "Trong tiếng Anh, luôn dùng 'Excuse me' trước khi hỏi đường một cách lịch sự.",
      vocabulary: [
        {
          word: "intersection",
          phonetic: "/ˌɪntərˈsekʃn/",
          pos: "noun",
          defEn: "A point at which two or more things intersect.",
          defVn: "Ngã tư, giao lộ",
          exampleEn: "Turn left at the next intersection.",
          exampleVn: "Rẽ trái ở ngã tư tiếp theo.",
        },
        {
          word: "opposite",
          phonetic: "/ˈɑːpəzɪt/",
          pos: "preposition",
          defEn: "In a position on the other side of a specific space.",
          defVn: "Đối diện",
          exampleEn: "The bank is opposite the post office.",
          exampleVn: "Ngân hàng đối diện với bưu điện.",
        },
      ],
      readingPassage: "When tourist Liam arrived in central London, he needed to find the national library.",
      readingPassageVn: "Khi du khách Liam đến trung tâm London, anh ấy cần tìm thư viện quốc gia.",
      listeningScript: "Excuse me, could you tell me where the nearest underground station is?",
      exercises: [
        {
          type: "mcq",
          prompt: "Which phrase is most polite?",
          options: ["Tell me where is bank", "Could you tell me the way to the bank?", "Where bank?"],
          answer: "Could you tell me the way to the bank?",
          explanation: "'Could you tell me...' is standard polite inquiry phrasing.",
        },
        {
          type: "fill_blank",
          prompt: "Turn left ___ the intersection. (at/on)",
          answer: "at",
          explanation: "We use preposition 'at' with intersection.",
        },
      ],
      summary: "Mastered polite directional questions and key prepositions of place.",
    };

    const parsed = GeneratedLessonSchema.safeParse(validLesson);
    expect(parsed.success).toBe(true);
  });

  it("should reject a malformed lesson with missing required fields", () => {
    const invalidLesson = {
      title: "Broken Lesson",
      // missing objectives, grammarExplanation, etc.
    };

    const parsed = GeneratedLessonSchema.safeParse(invalidLesson);
    expect(parsed.success).toBe(false);
  });

  it("should validate a structured writing evaluation rubric", () => {
    const validRubric = {
      overallScore: 82,
      cefrEstimated: "B1",
      grammarFeedback: {
        score: 80,
        comments: "Good sentence formation with minor preposition slips.",
        errors: [
          {
            originalText: "I am agree",
            correction: "I agree",
            explanation: "'Agree' is a verb, so do not use with 'am'.",
          },
        ],
      },
      vocabularyFeedback: {
        score: 85,
        comments: "Solid range of B1 terminology.",
        suggestions: ["substantial benefit", "consequently"],
      },
      coherenceFeedback: {
        score: 80,
        comments: "Logical sequence of ideas with clear paragraphing.",
      },
      taskCompletionFeedback: {
        score: 85,
        comments: "Addressed all required elements of the prompt.",
      },
      improvedVersion: "I agree with the proposal because it provides substantial benefits to the team.",
      vietnameseSummary: "Bài viết rõ ràng, hãy chú ý không dùng 'am' trước động từ 'agree'.",
    };

    const parsed = WritingEvaluationSchema.safeParse(validRubric);
    expect(parsed.success).toBe(true);
  });
});
