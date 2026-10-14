"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AudioButton } from "@/components/AudioButton";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Award,
  GraduationCap,
  RotateCcw,
  Layers,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { checkAnswer } from "@/lib/grading";

export interface VocabTestWord {
  id: string; // userVocabId or wordId
  word: string;
  phonetic?: string | null;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
  cefrLevel: string;
  topic: string;
  status: string;
}

interface Question {
  id: string;
  type: "en_to_vn" | "vn_to_en" | "fill_blank" | "type_answer";
  prompt: string;
  promptSub?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  wordItem: VocabTestWord;
}

export function VocabTestClient({ allWords }: { allWords: VocabTestWord[] }) {
  // Config state
  const [levelFilter, setLevelFilter] = useState("all");
  const [testLength, setTestLength] = useState(10);
  const [testMode, setTestMode] = useState<"mixed" | "en_to_vn" | "vn_to_en" | "type_answer">("mixed");
  const [isStarted, setIsStarted] = useState(false);

  // Test state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, { isCorrect: boolean; showExplanation: boolean }>
  >({});
  const [currentSelectedOption, setCurrentSelectedOption] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  // Start test and build dynamic questions
  const handleStartTest = () => {
    // 1. Filter eligible words
    let pool = allWords.filter(
      (w) => levelFilter === "all" || w.cefrLevel === levelFilter
    );

    if (pool.length < 4) {
      alert("Need at least 4 vocabulary words to generate a test. Please add more words.");
      return;
    }

    // 2. Sort pool: unmastered words first, shuffle slightly
    pool.sort((a, b) => {
      const aWeight = a.status === "mastered" ? 1 : 0;
      const bWeight = b.status === "mastered" ? 1 : 0;
      return aWeight - bWeight || Math.random() - 0.5;
    });

    const selectedPool = pool.slice(0, Math.min(testLength, pool.length));

    // 3. Generate questions
    const generated: Question[] = selectedPool.map((target, idx) => {
      let qType: "en_to_vn" | "vn_to_en" | "fill_blank" | "type_answer" =
        testMode === "mixed" ? "en_to_vn" : (testMode as any);

      if (testMode === "mixed") {
        const types: Array<"en_to_vn" | "vn_to_en" | "type_answer" | "fill_blank"> = [
          "en_to_vn",
          "vn_to_en",
          "type_answer",
          "fill_blank",
        ];
        qType = types[idx % types.length];
      }

      // Pick 3 distractors from the pool
      const otherWords = pool.filter((w) => w.word !== target.word);
      otherWords.sort(() => Math.random() - 0.5);
      const distractors = otherWords.slice(0, 3);

      if (qType === "en_to_vn") {
        const options = [target.defVn, ...distractors.map((d) => d.defVn)].sort(
          () => Math.random() - 0.5
        );
        return {
          id: `q-${idx}`,
          type: "en_to_vn",
          prompt: `What is the Vietnamese meaning of "${target.word}"?`,
          promptSub: target.exampleEn ? `Example: "${target.exampleEn}"` : undefined,
          options,
          correctAnswer: target.defVn,
          explanation: `"${target.word}" (${target.pos}) means "${target.defVn}" in Vietnamese. Def: ${target.defEn}`,
          wordItem: target,
        };
      } else if (qType === "vn_to_en") {
        const options = [target.word, ...distractors.map((d) => d.word)].sort(
          () => Math.random() - 0.5
        );
        return {
          id: `q-${idx}`,
          type: "vn_to_en",
          prompt: `Which English word corresponds to: "${target.defVn}"?`,
          promptSub: target.exampleVn ? `Ví dụ: "${target.exampleVn}"` : undefined,
          options,
          correctAnswer: target.word,
          explanation: `"${target.word}" is the English term for "${target.defVn}".`,
          wordItem: target,
        };
      } else if (qType === "fill_blank" && target.exampleEn) {
        // Replace target word in example
        const regex = new RegExp(`\\b${target.word}\\b`, "i");
        const blanked = target.exampleEn.replace(regex, "______");
        const options = [target.word, ...distractors.map((d) => d.word)].sort(
          () => Math.random() - 0.5
        );
        return {
          id: `q-${idx}`,
          type: "fill_blank",
          prompt: `Fill in the missing word in the sentence:`,
          promptSub: `“${blanked}”`,
          options,
          correctAnswer: target.word,
          explanation: `The sentence requires "${target.word}" (${target.defVn}).`,
          wordItem: target,
        };
      } else {
        // type_answer
        return {
          id: `q-${idx}`,
          type: "type_answer",
          prompt: `Type the English word for: "${target.defVn}"`,
          promptSub: `Hint: Starts with "${target.word.charAt(0)}" (${target.pos}, ${target.cefrLevel})`,
          correctAnswer: target.word,
          explanation: `The correct spelling is "${target.word}".`,
          wordItem: target,
        };
      }
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    setSubmittedAnswers({});
    setCurrentSelectedOption("");
    setIsCompleted(false);
    setIsStarted(true);
  };

  const currentQ = questions[currentIndex];

  // Submit answer for current question
  const handleSubmitAnswer = () => {
    if (!currentQ) return;
    const isCorrect = checkAnswer(
      currentQ.type === "type_answer" ? "short_answer" : "mcq",
      currentSelectedOption,
      currentQ.correctAnswer
    );

    setAnswers((prev) => ({ ...prev, [currentQ.id]: currentSelectedOption }));
    setSubmittedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { isCorrect, showExplanation: true },
    }));

    // If answer is incorrect, adjust user's review scheduling for this word
    if (!isCorrect && currentQ.wordItem.id) {
      fetch("/api/vocabulary/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userVocabId: currentQ.wordItem.id,
          rating: 1, // Again
        }),
      }).catch(console.error);
    }
  };

  // Next question or finish
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentSelectedOption(answers[questions[currentIndex + 1]?.id] || "");
    } else {
      handleFinishTest();
    }
  };

  // Finish test and save attempt
  const handleFinishTest = async () => {
    setIsCompleted(true);
    setSavingResult(true);

    try {
      let correct = 0;
      questions.forEach((q) => {
        if (submittedAnswers[q.id]?.isCorrect) {
          correct += 1;
        }
      });

      const maxScore = questions.length;
      const percentage = maxScore > 0 ? Math.round((correct / maxScore) * 100) : 0;

      // Find or create vocabulary test in db
      await fetch("/api/tests/save-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testTitle: `Vocabulary Practice Quiz (${levelFilter.toUpperCase()})`,
          category: "vocabulary",
          cefrLevel: levelFilter,
          score: correct,
          maxScore,
          percentage,
          passed: percentage >= 70,
          answers: answers,
          weakTopics: questions
            .filter((q) => !submittedAnswers[q.id]?.isCorrect)
            .map((q) => q.wordItem.topic || "Vocabulary"),
        }),
      });
    } catch (err) {
      console.error("Failed to save vocabulary test attempt:", err);
    } finally {
      setSavingResult(false);
    }
  };

  const correctCount = Object.values(submittedAnswers).filter((s) => s.isCorrect).length;
  const isCurrentSubmitted = Boolean(submittedAnswers[currentQ?.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vocabulary</span>
        </Link>
      </div>

      {!isStarted ? (
        /* Configuration Screen */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Vocabulary Quiz Generator</h1>
              <p className="text-xs text-slate-500">
                Customizable test testing recall, spelling, and contextual usage.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="all">All Levels (A1 to B2)</option>
                <option value="A1">A1 Level</option>
                <option value="A2">A2 Level</option>
                <option value="B1">B1 Level</option>
                <option value="B2">B2 Level</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Question Type Mode
              </label>
              <select
                value={testMode}
                onChange={(e) => setTestMode(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="mixed">Mixed (MCQ + Fill In + Spelling)</option>
                <option value="en_to_vn">English Word → Vietnamese Meaning (MCQ)</option>
                <option value="vn_to_en">Vietnamese Meaning → English Word (MCQ)</option>
                <option value="type_answer">Type Answer (No choices / Active recall)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Number of Questions
              </label>
              <select
                value={testLength}
                onChange={(e) => setTestLength(parseInt(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value={5}>5 Questions (Fast drill)</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={15}>15 Questions (Thorough evaluation)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartTest}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
          >
            Start Vocabulary Test
          </button>
        </div>
      ) : isCompleted ? (
        /* Results Screen */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-5">
          <div className="inline-flex p-3 bg-blue-100 text-blue-700 rounded-full">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">Quiz Completed!</h2>

          <div className="text-4xl font-black text-blue-600">
            {correctCount} / {questions.length}
          </div>
          <p className="text-xs text-slate-500">
            Score: <strong>{Math.round((correctCount / questions.length) * 100)}%</strong>
          </p>

          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {correctCount === questions.length
              ? "Flawless score! Words tested will be scheduled further into the future via SM-2."
              : "Great effort! Any incorrect words have been rescheduled for prompt review in your flashcards."}
          </p>

          {/* Question Review List */}
          <div className="text-left pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Question-by-Question Review:
            </h3>
            {questions.map((q, idx) => {
              const res = submittedAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className={`p-3 border rounded-lg text-xs ${
                    res?.isCorrect ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>
                      {idx + 1}. {q.prompt}
                    </span>
                    <span className={res?.isCorrect ? "text-emerald-700" : "text-rose-700"}>
                      {res?.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Your answer: <strong>{answers[q.id] || "(no answer)"}</strong> | Correct:{" "}
                    <strong className="text-slate-900">{q.correctAnswer}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartTest}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Test</span>
            </button>
            <Link
              href="/vocabulary"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
            >
              Vocabulary Bank
            </Link>
          </div>
        </div>
      ) : (
        /* Active Test Question Screen */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-blue-600 font-bold">{currentQ.wordItem.cefrLevel} Level</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 transition-all"
              style={{
                width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`,
              }}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {currentQ.type.replace(/_/g, " ").toUpperCase()}
                </span>
                <AudioButton text={currentQ.wordItem.word} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{currentQ.prompt}</h2>
              {currentQ.promptSub && (
                <p className="text-xs text-slate-600 mt-1 italic">{currentQ.promptSub}</p>
              )}
            </div>

            {/* Answer Input */}
            {currentQ.options ? (
              <div className="space-y-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = currentSelectedOption === opt;
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        value={opt}
                        checked={isSelected}
                        disabled={isCurrentSubmitted}
                        onChange={(e) => setCurrentSelectedOption(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  disabled={isCurrentSubmitted}
                  value={currentSelectedOption}
                  onChange={(e) => setCurrentSelectedOption(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            )}

            {/* Feedback & Explanation */}
            {isCurrentSubmitted && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1 ${
                  submittedAnswers[currentQ.id]?.isCorrect
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {submittedAnswers[currentQ.id]?.isCorrect ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Incorrect! Correct answer is: {currentQ.correctAnswer}</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] mt-1">{currentQ.explanation}</div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {!isCurrentSubmitted ? (
                <button
                  type="button"
                  disabled={!currentSelectedOption.trim()}
                  onClick={handleSubmitAnswer}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  <span>
                    {currentIndex + 1 < questions.length ? "Next Question" : "View Results"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
