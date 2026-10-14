"use client";

import React, { useState } from "react";
import { AudioButton } from "@/components/AudioButton";
import { WritingEvaluation } from "@/lib/ai/schemas";
import {
  BookOpen,
  PenTool,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  BookmarkPlus,
  BookmarkCheck,
  AlertCircle,
  Award,
} from "lucide-react";

interface ReadingPassageData {
  id: string;
  level: "A1" | "A2" | "B1" | "B2";
  title: string;
  topic: string;
  textEn: string;
  textVn: string;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
}

const READING_PASSAGES: ReadingPassageData[] = [
  {
    id: "read-a1",
    level: "A1",
    title: "A Day in the Life of Liam",
    topic: "Daily Routine",
    textEn:
      "Liam is a baker in Melbourne. Every morning, he wakes up at four o'clock. The bakery smells like fresh bread and sweet cinnamon. Liam loves his job because he meets many friendly neighbors every day.",
    textVn:
      "Liam là một thợ làm bánh ở Melbourne. Mỗi sáng, anh ấy thức dậy lúc bốn giờ. Tiệm bánh thơm mùi bánh mì tươi và quế ngọt ngào. Liam yêu công việc của mình vì anh được gặp gỡ nhiều người hàng xóm thân thiện mỗi ngày.",
    questions: [
      {
        question: "What time does Liam wake up?",
        options: ["At 4:00 AM", "At 6:00 AM", "At 8:00 AM", "At midnight"],
        answer: "At 4:00 AM",
        explanation: "The passage states that Liam wakes up at four o'clock every morning.",
      },
      {
        question: "Why does Liam enjoy his job?",
        options: [
          "He earns lots of money",
          "He meets friendly neighbors",
          "He works alone",
          "He sleeps late",
        ],
        answer: "He meets friendly neighbors",
        explanation: "He loves his job because he meets many friendly neighbors every day.",
      },
    ],
  },
  {
    id: "read-a2",
    level: "A2",
    title: "A Memorable Trip to Da Lat",
    topic: "Travel & Memories",
    textEn:
      "Last November, my friends and I traveled to Da Lat by sleeper bus. When we arrived, the mountain air was crisp and cool. We rented two scooters and rode through pine forests to reach a hidden waterfall. Although we got lost for an hour, a local farmer guided us back to the main road.",
    textVn:
      "Tháng 11 năm ngoái, tôi và bạn bè đã đi du lịch Đà Lạt bằng xe giường nằm. Khi chúng tôi đến nơi, không khí miền núi se lạnh và trong lành. Chúng tôi thuê hai chiếc xe máy và lái qua những rừng thông để đến một thác nước ẩn giấu. Dù bị lạc đường một tiếng đồng hồ, một bác nông dân địa phương đã chỉ đường cho chúng tôi trở lại đường chính.",
    questions: [
      {
        question: "How did they travel to Da Lat?",
        options: ["By airplane", "By sleeper bus", "By train", "By bicycle"],
        answer: "By sleeper bus",
        explanation: "The text specifies they traveled 'by sleeper bus'.",
      },
      {
        question: "Who helped them when they got lost?",
        options: ["A tour guide", "A police officer", "A local farmer", "A hotel receptionist"],
        answer: "A local farmer",
        explanation: "A local farmer kindly guided them back to the main road.",
      },
    ],
  },
  {
    id: "read-b1",
    level: "B1",
    title: "The Changing Landscape of Remote Work",
    topic: "Work & Modern Society",
    textEn:
      "Over the past five years, remote employment has transformed global work culture. Advocates emphasize enhanced flexibility, reduced commuting stress, and improved work-life balance. Nonetheless, psychologists caution that prolonged telecommuting can lead to social isolation and blurred boundaries between professional duties and private life.",
    textVn:
      "Trong năm năm qua, làm việc từ xa đã biến đổi văn hóa làm việc toàn cầu. Những người ủng hộ nhấn mạnh sự linh hoạt nâng cao, giảm căng thẳng khi di chuyển, và cải thiện cân bằng giữa công việc và cuộc sống. Dù vậy, các nhà tâm lý học cảnh báo rằng làm việc từ xa kéo dài có thể dẫn đến sự cô lập xã hội và xóa nhòa ranh giới giữa nghĩa vụ nghề nghiệp và đời sống riêng tư.",
    questions: [
      {
        question: "What is cited as a key benefit of remote work?",
        options: [
          "Higher tax rates",
          "Enhanced flexibility and less commuting stress",
          "Mandatory overtime",
          "No internet required",
        ],
        answer: "Enhanced flexibility and less commuting stress",
        explanation: "Advocates point to enhanced flexibility and reduced commuting stress.",
      },
      {
        question: "What concern do psychologists express?",
        options: [
          "Computers breaking down",
          "Social isolation and blurred boundaries",
          "Lower salaries",
          "Excessive travel",
        ],
        answer: "Social isolation and blurred boundaries",
        explanation: "Psychologists caution that prolonged telecommuting can lead to isolation and blurred boundaries.",
      },
    ],
  },
  {
    id: "read-b2",
    level: "B2",
    title: "Sustainable Urbanism and Transit-Oriented Development",
    topic: "Environment & Urban Planning",
    textEn:
      "Contemporary municipal authorities increasingly champion transit-oriented development (TOD) as an indispensable strategy to mitigate urban sprawl. By clustering residential hubs, commercial districts, and public amenities around high-capacity transit corridors, cities can substantially curb vehicular emissions. However, urban economists note that without stringent inclusionary zoning ordinances, TOD projects risk driving up real estate values and displacing vulnerable socio-economic cohorts.",
    textVn:
      "Các cơ quan quản lý đô thị đương đại ngày càng ủng hộ mô hình phát triển định hướng giao thông công cộng (TOD) như một chiến lược tất yếu để giảm bớt sự mở rộng tự phát của đô thị. Bằng cách tập trung các khu dân cư, trung tâm thương mại và tiện ích công cộng quanh các hành lang giao thông công suất lớn, các thành phố có thể hạn chế đáng kể khí thải từ xe cơ giới. Tuy nhiên, các nhà kinh tế học đô thị lưu ý rằng nếu thiếu các quy định phân vùng hòa nhập nghiêm ngặt, các dự án TOD có nguy cơ đẩy giá bất động sản lên cao và làm mất chỗ ở của các nhóm dân cư có hoàn cảnh khó khăn.",
    questions: [
      {
        question: "What is the primary ecological goal of Transit-Oriented Development (TOD)?",
        options: [
          "To increase parking lots",
          "To curb vehicular emissions and mitigate urban sprawl",
          "To eliminate public trains",
          "To double suburban highway capacity",
        ],
        answer: "To curb vehicular emissions and mitigate urban sprawl",
        explanation: "TOD clusters hubs around transit corridors to curb emissions and mitigate sprawl.",
      },
      {
        question: "What socio-economic risk do economists warn about?",
        options: [
          "Rising property values and displacement of vulnerable populations",
          "Decrease in public transport usage",
          "Lack of commercial stores",
          "Excessive green parks",
        ],
        answer: "Rising property values and displacement of vulnerable populations",
        explanation: "Without inclusionary zoning, TOD can inflate real estate values and displace vulnerable groups.",
      },
    ],
  },
];

const WRITING_PROMPTS = [
  {
    level: "A1",
    title: "A1: Introduce Yourself & Your Family",
    prompt:
      "Write a short paragraph (40–60 words) introducing yourself. State your name, age, city, job or study, and describe one member of your family.",
  },
  {
    level: "A2",
    title: "A2: An Email About Your Weekend Trip",
    prompt:
      "Write an email to a friend (60–90 words) describing a weekend trip you took recently. Mention where you went, what activities you did, and how you felt.",
  },
  {
    level: "B1",
    title: "B1: Opinion Paragraph: Remote Working vs Office",
    prompt:
      "Write an opinion response (100–140 words) on whether working from home is better than working in an office. Provide at least two reasons and a personal example.",
  },
  {
    level: "B2",
    title: "B2: Academic Argument: Technology and Education",
    prompt:
      "Write an academic paragraph (140–200 words) discussing whether artificial intelligence enhances or impairs student critical thinking. Employ cautious hedging (e.g., 'tends to', 'evidence suggests') and formal discourse markers.",
  },
];

export function PracticeClient() {
  const [activeTab, setActiveTab] = useState<"reading" | "writing">("reading");

  // Reading Tab State
  const [selectedReadingId, setSelectedReadingId] = useState("read-a1");
  const [showVnTranslation, setShowVnTranslation] = useState(false);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingFeedback, setReadingFeedback] = useState<
    Record<string, { isCorrect: boolean; showExplanation: boolean }>
  >({});
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  // Writing Tab State
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [studentText, setStudentText] = useState("");
  const [targetLevel, setTargetLevel] = useState<"A1" | "A2" | "B1" | "B2">("A1");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const currentReading =
    READING_PASSAGES.find((p) => p.id === selectedReadingId) || READING_PASSAGES[0];
  const currentPrompt = WRITING_PROMPTS[selectedPromptIndex];

  // Save word from reading
  const handleSaveWord = async (w: string) => {
    try {
      const res = await fetch("/api/vocabulary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: w,
          pos: "word",
          defEn: `Word encountered in ${currentReading.level} reading practice`,
          defVn: `Từ vựng trong bài đọc ${currentReading.level}`,
          cefrLevel: currentReading.level,
          topic: currentReading.topic,
        }),
      });
      if (res.ok) {
        setSavedWords((prev) => ({ ...prev, [w.toLowerCase()]: true }));
      }
    } catch (err) {
      console.error("Save word error:", err);
    }
  };

  // Check reading question
  const handleCheckReadingQuestion = (qIdx: number, userAns: string) => {
    const q = currentReading.questions[qIdx];
    const isCorrect = userAns === q.answer;
    setReadingFeedback((prev) => ({
      ...prev,
      [`${currentReading.id}-${qIdx}`]: { isCorrect, showExplanation: true },
    }));
  };

  // Evaluate Writing Submission
  const handleEvaluateWriting = async () => {
    if (studentText.trim().split(/\s+/).length < 5) {
      alert("Please write at least 5-10 words before requesting feedback.");
      return;
    }

    setEvaluating(true);
    setEvaluation(null);

    try {
      const res = await fetch("/api/practice/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt.prompt,
          studentText: studentText.trim(),
          topic: currentPrompt.title,
          targetLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setEvaluation(data.evaluation);
      setIsFallback(Boolean(data.isFallback));
    } catch (err: any) {
      alert("Error evaluating writing: " + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const wordCount = studentText.trim() ? studentText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Reading & Writing Practice
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Sharpen comprehension with authentic level-graded passages, and write essays/emails with structured AI rubric feedback.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("reading")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "reading"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reading Comprehension</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("writing")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "writing"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Writing Practice & Rubric</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: READING ===================== */}
      {activeTab === "reading" && (
        <div className="space-y-6">
          {/* Level Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {READING_PASSAGES.map((p) => {
              const isSelected = p.id === selectedReadingId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedReadingId(p.id);
                    setShowVnTranslation(false);
                    setClickedWord(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {p.level}
                  </span>
                  <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500">{p.topic}</div>
                </button>
              );
            })}
          </div>

          {/* Reading Passage Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded mr-2">
                  {currentReading.level}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Topic: {currentReading.topic}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{currentReading.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <AudioButton text={currentReading.textEn} label="Listen" rate={0.85} />
                <button
                  type="button"
                  onClick={() => setShowVnTranslation(!showVnTranslation)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                >
                  {showVnTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showVnTranslation ? "Hide Vietnamese" : "Show Vietnamese"}</span>
                </button>
              </div>
            </div>

            {/* Clickable passage text */}
            <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-800 font-serif">
              {currentReading.textEn.split(" ").map((w, idx) => {
                const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
                return (
                  <span
                    key={idx}
                    onClick={() => clean && setClickedWord(clean)}
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-900 rounded px-0.5 transition"
                  >
                    {w}{" "}
                  </span>
                );
              })}
            </div>

            {/* Word click popup */}
            {clickedWord && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900">{clickedWord}</span>
                  <AudioButton text={clickedWord} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveWord(clickedWord)}
                    disabled={savedWords[clickedWord]}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                      savedWords[clickedWord]
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {savedWords[clickedWord] ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" /> Saved
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" /> Save to Vocab
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickedWord(null)}
                    className="text-slate-400 hover:text-slate-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Translation view */}
            {showVnTranslation && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-950">
                <strong className="block text-amber-900 font-semibold mb-1">
                  Bản dịch tiếng Việt:
                </strong>
                {currentReading.textVn}
              </div>
            )}

            {/* Comprehension Questions */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Comprehension Questions:
              </h3>
              {currentReading.questions.map((q, qIdx) => {
                const fbKey = `${currentReading.id}-${qIdx}`;
                const fb = readingFeedback[fbKey];
                const selected = readingAnswers[fbKey];

                return (
                  <div key={qIdx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-900 mb-2">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={`flex items-center gap-2.5 p-2 rounded border text-xs cursor-pointer transition ${
                            selected === opt
                              ? "border-blue-600 bg-blue-50 text-blue-900 font-medium"
                              : "border-slate-200 hover:bg-white text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`reading-q-${fbKey}`}
                            value={opt}
                            checked={selected === opt}
                            onChange={() => {
                              setReadingAnswers((prev) => ({ ...prev, [fbKey]: opt }));
                              handleCheckReadingQuestion(qIdx, opt);
                            }}
                            className="text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    {fb && (
                      <div
                        className={`mt-3 p-2.5 rounded text-xs flex items-start gap-1.5 ${
                          fb.isCorrect
                            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                            : "bg-rose-50 text-rose-900 border border-rose-200"
                        }`}
                      >
                        {fb.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block">
                            {fb.isCorrect ? "Correct!" : `Incorrect. Answer is: ${q.answer}`}
                          </strong>
                          <p className="text-[11px] mt-0.5">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: WRITING ===================== */}
      {activeTab === "writing" && (
        <div className="space-y-6">
          {/* Prompt Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Writing Task Prompt:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WRITING_PROMPTS.map((p, idx) => {
                const isSelected = selectedPromptIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPromptIndex(idx);
                      setTargetLevel(p.level as any);
                      setEvaluation(null);
                    }}
                    className={`p-3 rounded-lg border text-left text-xs transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 font-bold text-blue-900 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded mr-1.5">
                      {p.level}
                    </span>
                    <span>{p.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Prompt details box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 mt-2">
              <strong className="block text-slate-900 font-bold mb-1">Task Instructions:</strong>
              {currentPrompt.prompt}
            </div>
          </div>

          {/* Student Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Your Response</h2>
              <span className="text-xs text-slate-500 font-mono">
                {wordCount} words | {studentText.length} characters
              </span>
            </div>

            <textarea
              rows={8}
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="Write your response in English here..."
              className="w-full text-sm border border-slate-300 rounded-xl p-4 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
            />

            <button
              type="button"
              disabled={evaluating || wordCount < 5}
              onClick={handleEvaluateWriting}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating grammar, vocabulary & coherence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit for AI Rubric Evaluation</span>
                </>
              )}
            </button>
          </div>

          {/* Rubric Evaluation Results */}
          {evaluation && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Estimated: {evaluation.cefrEstimated} Tier
                    </span>
                    {isFallback && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Offline Rule-Based Rubric
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    Automated Writing Rubric Evaluation
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600">
                    {evaluation.overallScore} / 100
                  </div>
                  <span className="text-[11px] text-slate-500">Overall Score</span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This automated rubric highlights grammar nuances, collocations, and coherence patterns for learning guidance.
                </span>
              </div>

              {/* Rubric Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Grammar */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">Grammar & Syntax</span>
                    <span className="text-blue-600">{evaluation.grammarFeedback.score}%</span>
                  </div>
                  <p className="text-xs text-slate-600">{evaluation.grammarFeedback.comments}</p>
                </div>

                {/* Vocabulary */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">Lexical Resource</span>
                    <span className="text-blue-600">{evaluation.vocabularyFeedback.score}%</span>
                  </div>
                  <p className="text-xs text-slate-600">{evaluation.vocabularyFeedback.comments}</p>
                </div>

                {/* Coherence */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">Coherence & Structure</span>
                    <span className="text-blue-600">{evaluation.coherenceFeedback.score}%</span>
                  </div>
                  <p className="text-xs text-slate-600">{evaluation.coherenceFeedback.comments}</p>
                </div>

                {/* Task Completion */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">Task Completion</span>
                    <span className="text-blue-600">{evaluation.taskCompletionFeedback.score}%</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {evaluation.taskCompletionFeedback.comments}
                  </p>
                </div>
              </div>

              {/* Grammar Errors Table */}
              {evaluation.grammarFeedback.errors.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Identified Mistakes & Recommended Corrections:
                  </h4>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {evaluation.grammarFeedback.errors.map((err, i) => (
                      <div key={i} className="p-3 bg-white space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono line-through rounded">
                            {err.originalText}
                          </span>
                          <span>→</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded">
                            {err.correction}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] pt-1">{err.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Suggestions */}
              {evaluation.vocabularyFeedback.suggestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Recommended Natural Collocations & Vocabulary:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.vocabularyFeedback.suggestions.map((sug, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-medium"
                      >
                        {sug}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improved Model Version */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Improved Model Version (Preserving Your Voice):
                </h4>
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs leading-relaxed text-emerald-950 font-serif">
                  {evaluation.improvedVersion}
                </div>
              </div>

              {/* Vietnamese Summary */}
              {evaluation.vietnameseSummary && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed">
                  <strong className="block text-amber-900 font-bold mb-1">
                    Nhận xét & Hướng dẫn bằng tiếng Việt:
                  </strong>
                  {evaluation.vietnameseSummary}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
