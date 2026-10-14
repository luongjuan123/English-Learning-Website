import {
  GeneratedLesson,
  GeneratedLessonSchema,
  WritingEvaluation,
  WritingEvaluationSchema,
} from "./schemas";
import {
  buildLessonPrompt,
  buildWritingEvaluationPrompt,
  LessonPromptParams,
  WritingEvalPromptParams,
} from "./prompts";

/**
 * Robust LLM service that supports Google Gemini API, OpenAI, and high-fidelity fallback templates.
 */

export async function generateLessonWithAI(
  params: LessonPromptParams
): Promise<{ lesson: GeneratedLesson; isFallback: boolean }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey.trim() !== "") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildLessonPrompt(params) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(text);
        const validated = GeneratedLessonSchema.parse(parsed);
        return { lesson: validated, isFallback: false };
      }
    } catch (err) {
      console.warn("Gemini API call failed, using graceful fallback generator:", err);
    }
  } else if (openaiKey && openaiKey.trim() !== "") {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert English teacher. Output valid JSON adhering to the requested schema.",
            },
            { role: "user", content: buildLessonPrompt(params) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);
        const validated = GeneratedLessonSchema.parse(parsed);
        return { lesson: validated, isFallback: false };
      }
    } catch (err) {
      console.warn("OpenAI API call failed, using graceful fallback generator:", err);
    }
  }

  // Graceful high-fidelity fallback generator
  const fallback = createFallbackLesson(params);
  return { lesson: fallback, isFallback: true };
}

export async function evaluateWritingWithAI(
  params: WritingEvalPromptParams
): Promise<{ evaluation: WritingEvaluation; isFallback: boolean }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey.trim() !== "") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildWritingEvaluationPrompt(params) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(text);
        const validated = WritingEvaluationSchema.parse(parsed);
        return { evaluation: validated, isFallback: false };
      }
    } catch (err) {
      console.warn("Gemini API writing evaluation failed, using fallback:", err);
    }
  }

  // Graceful rule-based writing evaluation fallback
  const fallback = createFallbackWritingEvaluation(params);
  return { evaluation: fallback, isFallback: true };
}

/**
 * High quality deterministic template generator for lessons when API key is not yet set
 */
function createFallbackLesson(params: LessonPromptParams): GeneratedLesson {
  const topicTitle = params.topic.trim() || "Everyday Communication";
  const level = params.level;

  return {
    title: `${topicTitle} (${level} Level)`,
    objectives: [
      `Understand fundamental structures related to ${topicTitle}`,
      `Identify and practice target vocabulary for CEFR ${level}`,
      `Construct accurate sentences in speaking and writing`,
    ],
    grammarExplanation: `### Focus: ${topicTitle} (${level})

In this lesson, we study the core principles of **${topicTitle}**.

#### Key Principles:
1. **Form and Structure**: Focus on clear subject-verb agreement and natural word order.
2. **Usage Context**: Used in daily conversation, professional communication, and academic exchanges.
3. **Common Pitfalls**: Watch out for missing auxiliary verbs or unnatural literal translations from Vietnamese.

| English Pattern | Meaning (VN) | Example |
|---|---|---|
| Pattern 1 | Diễn đạt thói quen / trạng thái | I practice ${topicTitle} every day. |
| Pattern 2 | Diễn đạt mục tiêu / kết quả | She has improved a lot since last month. |`,
    vietnameseNotes: `Lưu ý ngữ pháp cho người học Việt Nam: Khi sử dụng chủ đề ${topicTitle}, hãy chú ý đến sự hòa hợp giữa chủ ngữ và động từ, đồng thời tránh dịch nguyên văn từ tiếng Việt từng từ một (word-by-word translation). Hãy chú ý các giới từ đi kèm.`,
    vocabulary: [
      {
        word: "develop",
        phonetic: "/dɪˈveləp/",
        pos: "verb",
        defEn: "Grow or cause to grow and become more mature, advanced, or elaborate.",
        defVn: "Phát triển, mở rộng",
        exampleEn: "We need to develop our language skills daily.",
        exampleVn: "Chúng ta cần phát triển kỹ năng ngôn ngữ mỗi ngày.",
      },
      {
        word: "effective",
        phonetic: "/ɪˈfektɪv/",
        pos: "adjective",
        defEn: "Successful in producing a desired or intended result.",
        defVn: "Hiệu quả, có kết quả tốt",
        exampleEn: "Spaced repetition is an effective study technique.",
        exampleVn: "Lặp lại ngắt quãng là một kỹ thuật học tập hiệu quả.",
      },
      {
        word: "strategy",
        phonetic: "/ˈstrætədʒi/",
        pos: "noun",
        defEn: "A plan of action or policy designed to achieve a major aim.",
        defVn: "Chiến lược, kế hoạch",
        exampleEn: "She adopted a new reading strategy for tests.",
        exampleVn: "Cô ấy đã áp dụng một chiến lược đọc mới cho các bài thi.",
      },
      {
        word: "express",
        phonetic: "/ɪkˈspres/",
        pos: "verb",
        defEn: "Convey a thought or feeling in words or by gestures and conduct.",
        defVn: "Bày tỏ, diễn đạt",
        exampleEn: "He learned to express his ideas clearly.",
        exampleVn: "Anh ấy đã học cách diễn đạt ý tưởng của mình một cách rõ ràng.",
      },
    ],
    readingPassage: `Mastering English at the ${level} tier requires deliberate daily practice with ${topicTitle}. Learners who actively engage with authentic texts, test their retention with quizzes, and note down new collocations achieve fluency much faster than passive students. Continuous effort always yields measurable progress.`,
    readingPassageVn: `Làm chủ tiếng Anh ở cấp độ ${level} đòi hỏi sự luyện tập có chủ đích hàng ngày với chủ đề ${topicTitle}. Những người học chủ động tiếp xúc với các văn bản tự nhiên, kiểm tra khả năng ghi nhớ qua các câu đố, và ghi chép các cụm từ mới sẽ đạt được sự lưu loát nhanh hơn nhiều so với học sinh thụ động. Nỗ lực liên tục luôn mang lại tiến bộ rõ rệt.`,
    listeningScript: `Welcome to today's focus on ${topicTitle}. Listen carefully to the pronunciation and rhythm of each sentence. With regular repetition, your comprehension will steadily improve.`,
    exercises: [
      {
        type: "mcq",
        prompt: `Which word best fits: 'To improve your English, you must ___ a daily reading habit.'`,
        promptVn: "Chọn từ phù hợp nhất để hoàn thành câu:",
        options: ["develop", "developing", "developer", "development"],
        answer: "develop",
        explanation: "Modal verb 'must' takes a base verb (bare infinitive): 'develop'.",
      },
      {
        type: "fill_blank",
        prompt: `Complete the sentence: 'Spaced repetition is an ___ (effective) way to memorize vocabulary.'`,
        promptVn: "Điền dạng đúng của từ:",
        answer: "effective",
        explanation: "Before the noun 'way', we use the adjective 'effective'.",
      },
      {
        type: "reorder",
        prompt: `Arrange the words in correct order: [skills / We / language / practice / daily]`,
        promptVn: "Sắp xếp lại câu thành câu hoàn chỉnh:",
        answer: "We practice language skills daily",
        explanation: "Subject (We) + Verb (practice) + Object (language skills) + Adverb of time (daily).",
      },
    ],
    summary: `In this lesson on ${topicTitle}, you reviewed core grammar principles, acquired 4 key vocabulary terms, and practiced targeted sentence construction.`,
  };
}

/**
 * High-quality fallback evaluation for student writing
 */
function createFallbackWritingEvaluation(
  params: WritingEvalPromptParams
): WritingEvaluation {
  const text = params.studentText.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const errors: { originalText: string; correction: string; explanation: string }[] = [];

  // Simple heuristic checks
  if (text.includes("i ") || text.startsWith("i ")) {
    errors.push({
      originalText: "i",
      correction: "I",
      explanation: "Personal pronoun 'I' must always be capitalized in English.",
    });
  }

  if (/\b(very good|very bad)\b/i.test(text)) {
    errors.push({
      originalText: "very good / very bad",
      correction: "exceptional / substandard",
      explanation: "At higher CEFR levels, use more specific and descriptive adjectives instead of overusing 'very'.",
    });
  }

  const score = Math.min(88, Math.max(50, wordCount >= 30 ? 75 : 55));

  return {
    overallScore: score,
    cefrEstimated: params.targetLevel,
    grammarFeedback: {
      score: score,
      comments:
        wordCount > 40
          ? "Good sentence structures observed with clear intent. Minor grammatical adjustments recommended for prepositions and verb agreement."
          : "Your sentences convey basic meaning, but try to write longer sentences using conjunctions (because, although, whereas).",
      errors,
    },
    vocabularyFeedback: {
      score: Math.min(90, score + 2),
      comments:
        "The vocabulary used aligns with the topic. Incorporating more collocations will elevate your score.",
      suggestions: ["foster development", "substantially improve", "invaluable perspective"],
    },
    coherenceFeedback: {
      score: score,
      comments:
        "Ideas follow a logical progression. Use linking phrases like 'Furthermore', 'On the other hand', and 'Consequently' to enhance flow.",
    },
    taskCompletionFeedback: {
      score: score,
      comments:
        wordCount >= 30
          ? "All key elements of the prompt were addressed effectively."
          : "The prompt was partially addressed; expanding your arguments with concrete examples will strengthen the response.",
    },
    improvedVersion: `${text} Furthermore, consistent practice and attention to precise terminology ensure greater communicative effectiveness in both academic and professional domains.`,
    vietnameseSummary:
      "Bài viết của bạn đã truyền đạt được ý tưởng cơ bản tốt. Để nâng cao band điểm, hãy chú ý sử dụng các từ nối câu phong phú hơn và áp dụng các cụm từ (collocations) tự nhiên.",
  };
}
