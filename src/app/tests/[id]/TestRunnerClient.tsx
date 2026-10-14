"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gradeTest } from "@/lib/grading";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface QuestionData {
  id: string;
  type: string;
  question: string;
  contextText?: string | null;
  optionsJson?: string | null;
  correctAnswer: string;
  explanation?: string | null;
  topic: string;
  orderIndex: number;
}

interface TestData {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  cefrLevel: string;
  timeLimitMinutes: number;
  passingScore: number;
  questions: QuestionData[];
}

export function TestRunnerClient({ test }: { test: TestData }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const currentQ = test.questions[currentIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleAnswerChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  // Finish and Grade Test
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Deterministic grading
      const gradingResult = gradeTest(test.questions, answers, test.passingScore);

      // 2. Persist attempt
      const res = await fetch("/api/tests/save-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.id,
          testTitle: test.title,
          category: test.category,
          cefrLevel: test.cefrLevel,
          score: gradingResult.score,
          maxScore: gradingResult.maxScore,
          percentage: gradingResult.percentage,
          passed: gradingResult.passed,
          answers,
          feedback: gradingResult.results,
          weakTopics: gradingResult.weakTopics,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/tests/results/${data.attemptId}`);
      } else {
        alert(data.error || "Failed to submit test");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert("Error submitting test: " + err.message);
      setIsSubmitting(false);
    }
  };

  let parsedOptions: string[] = [];
  if (currentQ?.optionsJson) {
    try {
      parsedOptions = JSON.parse(currentQ.optionsJson);
    } catch {}
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Time & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Test</span>
        </Link>

        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
            timeLeft < 180
              ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
              : "bg-slate-100 text-slate-800 border-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Time Remaining: {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Test Title & Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">
              {test.cefrLevel} Level
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{test.title}</h1>
          </div>
          <div className="text-xs text-slate-500 sm:text-right">
            <span>Answered: </span>
            <strong className="text-slate-900 font-bold">
              {answeredCount}/{test.questions.length}
            </strong>
          </div>
        </div>

        {/* Question numbers selector */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {test.questions.map((q, idx) => {
            const hasAnswer = Boolean(answers[q.id]?.trim());
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded text-xs font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
                    : hasAnswer
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              Question {currentIndex + 1} of {test.questions.length}
            </span>
            <span className="font-semibold text-slate-600">Topic: {currentQ.topic}</span>
          </div>

          {currentQ.contextText && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 mb-4 font-serif">
              {currentQ.contextText}
            </div>
          )}

          <h2 className="text-base font-bold text-slate-900 leading-snug">{currentQ.question}</h2>
        </div>

        {/* Input Types */}
        <div className="pt-2">
          {currentQ.type === "mcq" || currentQ.type === "error_identify" ? (
            <div className="space-y-2.5">
              {parsedOptions.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(opt)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Your Answer:
              </label>
              <input
                type="text"
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder={
                  currentQ.type === "sentence_order"
                    ? "Type the sentence in correct grammatical order..."
                    : "Type your answer..."
                }
                className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
          )}
        </div>

        {/* Navigation & Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentIndex + 1 < test.questions.length ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading test...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit & Finish Test</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
