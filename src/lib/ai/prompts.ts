export interface LessonPromptParams {
  level: "A1" | "A2" | "B1" | "B2";
  topic: string;
  lessonType: "grammar" | "vocabulary" | "reading" | "writing" | "listening" | "speaking" | "mixed";
  difficulty: "beginner" | "intermediate" | "advanced";
  length: "short" | "standard" | "comprehensive";
}

export function buildLessonPrompt(params: LessonPromptParams): string {
  return `You are a master English curriculum designer specializing in CEFR levels A1 through B2 for Vietnamese learners.
Generate a structured, high-quality English lesson for:
- CEFR Level: ${params.level}
- Topic: ${params.topic}
- Lesson Type: ${params.lessonType}
- Target Difficulty: ${params.difficulty}
- Scope/Length: ${params.length}

Requirements:
1. All English content must strictly match CEFR ${params.level}.
2. Provide precise, natural Vietnamese explanations and notes to assist learners in understanding English grammar nuances and common mistakes.
3. Include 4-6 related vocabulary items with phonetics, part of speech, English and Vietnamese definitions, and bilingual example sentences.
4. Provide a coherent reading passage and its Vietnamese translation.
5. Provide a listening script suitable for speech synthesis.
6. Provide at least 3 practice exercises (mix of mcq, fill_blank, and reorder) with answer keys and thorough explanations.
7. Output pure JSON strictly following this schema:
{
  "title": "string",
  "objectives": ["string", "string"],
  "grammarExplanation": "markdown string explaining the topic with markdown tables and bullet points",
  "vietnameseNotes": "string in Vietnamese clarifying nuances and pitfalls",
  "vocabulary": [
    {
      "word": "string",
      "phonetic": "/.../",
      "pos": "noun/verb/adj",
      "defEn": "English definition",
      "defVn": "Vietnamese meaning",
      "exampleEn": "English example",
      "exampleVn": "Vietnamese example"
    }
  ],
  "readingPassage": "English text",
  "readingPassageVn": "Vietnamese translation of reading passage",
  "listeningScript": "English audio transcript",
  "exercises": [
    {
      "type": "mcq" | "fill_blank" | "reorder",
      "prompt": "Exercise question in English",
      "promptVn": "Vietnamese translation or guidance",
      "options": ["A", "B", "C", "D"], // for mcq only
      "answer": "Correct answer",
      "explanation": "Why this is correct"
    }
  ],
  "summary": "Short takeaway summary"
}`;
}

export interface WritingEvalPromptParams {
  prompt: string;
  studentText: string;
  targetLevel: "A1" | "A2" | "B1" | "B2";
}

export function buildWritingEvaluationPrompt(params: WritingEvalPromptParams): string {
  return `You are an expert CEFR English writing examiner evaluating a student's submission.
Task Prompt: "${params.prompt}"
Target CEFR Level: ${params.targetLevel}
Student Submission:
"""
${params.studentText}
"""

Evaluate this writing according to standard CEFR rubrics across:
1. Grammar & Syntax: Identify specific errors, show original text, provide exact correction, and give clear explanation.
2. Vocabulary: Assess lexical resource and suggest 3-5 more natural or higher-level vocabulary alternatives.
3. Coherence & Structure: Assess paragraphing, logical progression, and linking words.
4. Task Completion: Assess whether the student answered all parts of the prompt.
5. Provide an improved model version of the student's text that preserves their original voice and ideas without completely rewriting it.
6. Provide a concise, encouraging Vietnamese summary.

Output pure JSON strictly adhering to:
{
  "overallScore": number (0 to 100),
  "cefrEstimated": "A1" | "A2" | "B1" | "B2",
  "grammarFeedback": {
    "score": number (0 to 100),
    "comments": "string",
    "errors": [
      {
        "originalText": "string",
        "correction": "string",
        "explanation": "string"
      }
    ]
  },
  "vocabularyFeedback": {
    "score": number (0 to 100),
    "comments": "string",
    "suggestions": ["string", "string"]
  },
  "coherenceFeedback": {
    "score": number (0 to 100),
    "comments": "string"
  },
  "taskCompletionFeedback": {
    "score": number (0 to 100),
    "comments": "string"
  },
  "improvedVersion": "string",
  "vietnameseSummary": "string in Vietnamese"
}`;
}
