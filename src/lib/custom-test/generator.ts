import { prisma } from "@/lib/db";
import { z } from "zod";

export interface WordDetail {
  word: string;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
}

export interface ServerQuestion {
  id: string;
  type: string;
  prompt: string;
  promptSub?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  targetWord: string;
  exampleEn?: string;
  exampleVn?: string;
  hint?: string;
}

export interface ClientQuestion {
  id: string;
  type: string;
  prompt: string;
  promptSub?: string;
  options?: string[];
  hint?: string;
}

export interface TestConfig {
  questionType:
    | "en_to_vn"
    | "vn_to_en"
    | "vocab_mcq"
    | "fill_blank"
    | "complete_sentence"
    | "matching"
    | "type_answer"
    | "mixed";
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "auto";
  language: "en" | "vi";
  timeLimitMinutes: number; // 0 = untimed
  shuffle: boolean;
  showHints: boolean;
}

const WordBatchSchema = z.array(
  z.object({
    word: z.string(),
    pos: z.string().default("word"),
    defEn: z.string().default("English definition"),
    defVn: z.string().default("Nghĩa tiếng Việt"),
    exampleEn: z.string().default(""),
    exampleVn: z.string().default(""),
  })
);

/**
 * Retrieves details for all words in the list, querying local database first
 * and using LLM / fallback generator for unindexed words.
 */
export async function resolveWordDetails(words: string[]): Promise<Map<string, WordDetail>> {
  const result = new Map<string, WordDetail>();
  const missingWords: string[] = [];

  // 1. Check existing words in database
  const lowerWords = words.map((w) => w.toLowerCase());
  const existingRecords = await prisma.vocabularyWord.findMany({
    where: {
      word: { in: lowerWords },
    },
  });

  const recordMap = new Map<string, typeof existingRecords[0]>();
  for (const rec of existingRecords) {
    recordMap.set(rec.word.toLowerCase(), rec);
  }

  for (const originalWord of words) {
    const lower = originalWord.toLowerCase();
    const found = recordMap.get(lower);
    if (found && found.defVn && found.defVn.trim() !== "") {
      result.set(lower, {
        word: originalWord,
        pos: found.pos || "word",
        defEn: found.defEn || `Definition for ${originalWord}`,
        defVn: found.defVn,
        exampleEn: found.exampleEn || `Example sentence containing "${originalWord}".`,
        exampleVn: found.exampleVn || `Câu ví dụ với từ "${originalWord}".`,
      });
    } else {
      missingWords.push(originalWord);
    }
  }

  // 2. Resolve missing words via LLM or deterministic fallback
  if (missingWords.length > 0) {
    const fetched = await fetchWordDetailsViaAI(missingWords);
    for (const item of fetched) {
      result.set(item.word.toLowerCase(), item);

      // Save to database so subsequent tests don't re-query
      try {
        await prisma.vocabularyWord.upsert({
          where: { word: item.word.toLowerCase() },
          update: {
            pos: item.pos,
            defEn: item.defEn,
            defVn: item.defVn,
            exampleEn: item.exampleEn,
            exampleVn: item.exampleVn,
          },
          create: {
            word: item.word.toLowerCase(),
            pos: item.pos,
            defEn: item.defEn,
            defVn: item.defVn,
            exampleEn: item.exampleEn,
            exampleVn: item.exampleVn,
            cefrLevel: "A2",
            topic: "Custom List",
          },
        });
      } catch (err) {
        console.warn("Could not cache word into VocabularyWord:", err);
      }
    }
  }

  return result;
}

/**
 * Fetches definitions and examples for a batch of words via LLM (with fallback)
 */
async function fetchWordDetailsViaAI(words: string[]): Promise<WordDetail[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `You are an expert bilingual English-Vietnamese lexicographer.
Provide accurate grammatical and lexical details for these English words or phrases:
${JSON.stringify(words)}

Output pure JSON strictly conforming to this schema (array of objects):
[
  {
    "word": "string (exact original word)",
    "pos": "noun/verb/adjective/adverb/phrase",
    "defEn": "concise English definition",
    "defVn": "accurate, natural Vietnamese meaning",
    "exampleEn": "natural English example sentence using the word naturally",
    "exampleVn": "Vietnamese translation of the example sentence"
  }
]`;

  if (geminiKey && geminiKey.trim() !== "") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const parsed = JSON.parse(text);
        const validated = WordBatchSchema.parse(parsed);
        return validated.map((v) => ({
          word: v.word,
          pos: v.pos,
          defEn: v.defEn,
          defVn: v.defVn,
          exampleEn: v.exampleEn,
          exampleVn: v.exampleVn,
        }));
      }
    } catch (err) {
      console.warn("AI word detail lookup failed, using fallback synthesizer:", err);
    }
  }

  // Graceful deterministic fallback synthesizer
  return words.map((w) => createFallbackWordDetail(w));
}

function createFallbackWordDetail(word: string): WordDetail {
  const clean = word.trim();
  return {
    word: clean,
    pos: "word",
    defEn: `Target vocabulary term: "${clean}"`,
    defVn: `Nghĩa của từ "${clean}"`,
    exampleEn: `We practiced using the word "${clean}" in our English conversation.`,
    exampleVn: `Chúng tôi đã thực hành sử dụng từ "${clean}" trong cuộc hội thoại tiếng Anh.`,
  };
}

/**
 * Synthesizes test questions strictly from the supplied word list
 */
export async function generateCustomTest(
  words: string[],
  config: TestConfig
): Promise<{ serverQuestions: ServerQuestion[]; clientQuestions: ClientQuestion[] }> {
  if (words.length === 0) {
    throw new Error("Cannot generate test from an empty word list.");
  }

  const wordDetailsMap = await resolveWordDetails(words);
  const wordList = words.map((w) => wordDetailsMap.get(w.toLowerCase())!).filter(Boolean);

  // If question count exceeds words, we cycle through words
  const questionCount = Math.max(1, config.questionCount || wordList.length);
  const targetWords: WordDetail[] = [];
  while (targetWords.length < questionCount) {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    targetWords.push(...shuffled);
  }
  const selectedTargets = targetWords.slice(0, questionCount);

  const isVi = config.language === "vi";

  const questionTypes: Array<
    | "en_to_vn"
    | "vn_to_en"
    | "vocab_mcq"
    | "fill_blank"
    | "complete_sentence"
    | "matching"
    | "type_answer"
  > =
    config.questionType === "mixed"
      ? [
          "en_to_vn",
          "vn_to_en",
          "vocab_mcq",
          "fill_blank",
          "complete_sentence",
          "type_answer",
        ]
      : [config.questionType as any];

  const serverQuestions: ServerQuestion[] = [];

  for (let i = 0; i < selectedTargets.length; i++) {
    const target = selectedTargets[i];
    const qType = questionTypes[i % questionTypes.length];
    const qId = `cq-${i + 1}`;

    // Pick 3 distractors STRICTLY from the rest of the supplied word list
    const otherWords = wordList.filter(
      (w) => w.word.toLowerCase() !== target.word.toLowerCase()
    );
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, Math.min(3, otherWords.length));

    let question: ServerQuestion;

    if (qType === "en_to_vn") {
      // English word -> Vietnamese meaning (MCQ)
      const options = [target.defVn, ...distractors.map((d) => d.defVn)].sort(
        () => Math.random() - 0.5
      );
      question = {
        id: qId,
        type: "en_to_vn",
        prompt: isVi
          ? `Từ "${target.word}" có nghĩa là gì trong tiếng Việt?`
          : `What is the correct Vietnamese meaning of "${target.word}"?`,
        promptSub: target.pos ? `(${target.pos})` : undefined,
        options,
        correctAnswer: target.defVn,
        explanation: `"${target.word}" (${target.pos}) có nghĩa là "${target.defVn}". ${target.defEn}`,
        targetWord: target.word,
        exampleEn: target.exampleEn,
        exampleVn: target.exampleVn,
        hint: `Starts with "${target.defVn.charAt(0)}"`,
      };
    } else if (qType === "vn_to_en") {
      // Vietnamese meaning -> English word (MCQ)
      const options = [target.word, ...distractors.map((d) => d.word)].sort(
        () => Math.random() - 0.5
      );
      question = {
        id: qId,
        type: "vn_to_en",
        prompt: isVi
          ? `Từ tiếng Anh nào mang nghĩa: "${target.defVn}"?`
          : `Which English word corresponds to: "${target.defVn}"?`,
        promptSub: target.pos ? `(${target.pos})` : undefined,
        options,
        correctAnswer: target.word,
        explanation: `"${target.word}" tương ứng với nghĩa "${target.defVn}".`,
        targetWord: target.word,
        exampleEn: target.exampleEn,
        exampleVn: target.exampleVn,
        hint: `Starts with letter "${target.word.charAt(0).toUpperCase()}"`,
      };
    } else if (qType === "vocab_mcq") {
      // Multiple-choice definition match
      const options = [target.defEn, ...distractors.map((d) => d.defEn)].sort(
        () => Math.random() - 0.5
      );
      question = {
        id: qId,
        type: "vocab_mcq",
        prompt: isVi
          ? `Định nghĩa nào dưới đây mô tả chính xác từ "${target.word}"?`
          : `Which definition accurately describes the word "${target.word}"?`,
        promptSub: `Vietnamese: ${target.defVn}`,
        options,
        correctAnswer: target.defEn,
        explanation: `Definition of "${target.word}": ${target.defEn} (VN: ${target.defVn}).`,
        targetWord: target.word,
        exampleEn: target.exampleEn,
        exampleVn: target.exampleVn,
        hint: `Part of speech: ${target.pos}`,
      };
    } else if (qType === "fill_blank" || qType === "complete_sentence") {
      // Contextual sentence fill in the blank
      let blankedSentence = target.exampleEn;
      const regex = new RegExp(`\\b${target.word}\\b`, "i");
      if (regex.test(blankedSentence)) {
        blankedSentence = blankedSentence.replace(regex, "______");
      } else {
        blankedSentence = `Please choose the appropriate word to complete: [ ______ ] (${target.defVn})`;
      }

      const options = [target.word, ...distractors.map((d) => d.word)].sort(
        () => Math.random() - 0.5
      );

      question = {
        id: qId,
        type: qType,
        prompt: isVi
          ? `Điền từ thích hợp vào chỗ trống trong câu sau:`
          : `Fill in the blank with the appropriate word:`,
        promptSub: `“${blankedSentence}”`,
        options,
        correctAnswer: target.word,
        explanation: `Câu hoàn chỉnh: "${target.exampleEn}". Nghĩa: ${target.defVn}.`,
        targetWord: target.word,
        exampleEn: target.exampleEn,
        exampleVn: target.exampleVn,
        hint: `Nghĩa tiếng Việt: ${target.defVn}`,
      };
    } else {
      // type_answer (Manual typing without multiple choice options)
      question = {
        id: qId,
        type: "type_answer",
        prompt: isVi
          ? `Hãy gõ từ tiếng Anh có nghĩa là: "${target.defVn}"`
          : `Type the English word for: "${target.defVn}"`,
        promptSub: `Gợi ý: ${target.pos ? `[${target.pos}]` : ""} bắt đầu bằng chữ "${target.word
          .charAt(0)
          .toUpperCase()}"`,
        correctAnswer: target.word,
        acceptedAnswers: [target.word.toLowerCase().trim()],
        explanation: `Từ chính xác là "${target.word}". Định nghĩa: ${target.defEn}.`,
        targetWord: target.word,
        exampleEn: target.exampleEn,
        exampleVn: target.exampleVn,
        hint: `First letter: "${target.word.charAt(0).toUpperCase()}", Length: ${target.word.length} letters`,
      };
    }

    serverQuestions.push(question);
  }

  // Shuffle order if requested
  let finalServerQuestions = serverQuestions;
  if (config.shuffle) {
    finalServerQuestions = [...serverQuestions].sort(() => Math.random() - 0.5);
    // Re-index IDs sequentially
    finalServerQuestions.forEach((q, idx) => {
      q.id = `cq-${idx + 1}`;
    });
  }

  // Create sanitized client questions (NEVER expose correctAnswer or explanation)
  const clientQuestions: ClientQuestion[] = finalServerQuestions.map((sq) => ({
    id: sq.id,
    type: sq.type,
    prompt: sq.prompt,
    promptSub: sq.promptSub,
    options: sq.options ? [...sq.options] : undefined,
    hint: config.showHints ? sq.hint : undefined,
  }));

  return {
    serverQuestions: finalServerQuestions,
    clientQuestions,
  };
}
