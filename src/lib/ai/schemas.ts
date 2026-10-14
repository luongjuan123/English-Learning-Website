import { z } from "zod";

export const ExerciseSchema = z.object({
  type: z.enum(["mcq", "fill_blank", "reorder"]),
  prompt: z.string().min(3),
  promptVn: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().min(3),
});

export const LessonVocabItemSchema = z.object({
  word: z.string().min(1),
  phonetic: z.string().optional(),
  pos: z.string().min(1),
  defEn: z.string().min(3),
  defVn: z.string().min(2),
  exampleEn: z.string().min(5),
  exampleVn: z.string().min(5),
});

export const GeneratedLessonSchema = z.object({
  title: z.string().min(3),
  objectives: z.array(z.string().min(3)).min(1),
  grammarExplanation: z.string().min(20),
  vietnameseNotes: z.string().min(10),
  vocabulary: z.array(LessonVocabItemSchema).min(2),
  readingPassage: z.string().min(20),
  readingPassageVn: z.string().min(20),
  listeningScript: z.string().min(15),
  exercises: z.array(ExerciseSchema).min(2),
  summary: z.string().min(10),
});

export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>;

export const WritingErrorItemSchema = z.object({
  originalText: z.string(),
  correction: z.string(),
  explanation: z.string(),
});

export const WritingEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  cefrEstimated: z.enum(["A1", "A2", "B1", "B2"]),
  grammarFeedback: z.object({
    score: z.number().min(0).max(100),
    comments: z.string(),
    errors: z.array(WritingErrorItemSchema),
  }),
  vocabularyFeedback: z.object({
    score: z.number().min(0).max(100),
    comments: z.string(),
    suggestions: z.array(z.string()),
  }),
  coherenceFeedback: z.object({
    score: z.number().min(0).max(100),
    comments: z.string(),
  }),
  taskCompletionFeedback: z.object({
    score: z.number().min(0).max(100),
    comments: z.string(),
  }),
  improvedVersion: z.string().min(20),
  vietnameseSummary: z.string().min(10),
});

export type WritingEvaluation = z.infer<typeof WritingEvaluationSchema>;

export const TestQuestionGeneratedSchema = z.object({
  type: z.enum(["mcq", "fill_blank", "sentence_order", "error_identify", "short_answer"]),
  question: z.string().min(5),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5),
  topic: z.string().min(2),
});

export const GeneratedTestSchema = z.object({
  title: z.string().min(5),
  description: z.string(),
  category: z.string(),
  cefrLevel: z.string(),
  timeLimitMinutes: z.number().min(5).max(60),
  passingScore: z.number().min(50).max(100),
  questions: z.array(TestQuestionGeneratedSchema).min(3),
});

export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;
