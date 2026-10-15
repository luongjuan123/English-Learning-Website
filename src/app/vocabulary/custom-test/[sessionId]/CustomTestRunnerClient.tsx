"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Clock, Sparkles } from "lucide-react";

interface ClientQuestion {
  id: string;
  type: string;
  prompt: string;
  promptSub?: string;
  options?: string[];
  hint?: string;
}

interface SessionData {
  id: string;
  title: string;
  status: string;
  configJson: string;
  clientQuestionsJson: string;
}

interface QuestionResult {
  questionId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  targetWord: string;
  exampleEn?: string;
  exampleVn?: string;
}

interface SubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  results: QuestionResult[];
  missedWords: string[];
}

export default function CustomTestRunnerClient({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reviewMode, setReviewMode] = useState<"all" | "incorrect">("all");
  const [addedToSR, setAddedToSR] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/vocabulary/custom-test/session/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setLoadError(d.error);
          return;
        }
        setSession(d.session);
        const qs: ClientQuestion[] = JSON.parse(d.session.clientQuestionsJson);
        setQuestions(qs);
        const cfg = JSON.parse(d.session.configJson);
        if (cfg.timeLimitMinutes > 0) {
          setTimeLeft(cfg.timeLimitMinutes * 60);
        }
      })
      .catch(() => setLoadError("Failed to load test session."));
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitResult) return;
    timerRef.current = setTimeout(() => {
      setTimeLeft((t) => (t !== null ? t - 1 : null));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, submitResult]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitResult) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/vocabulary/custom-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to submit test.");
        setSubmitting(false);
        return;
      }
      setSubmitResult(data);
    } catch {
      alert("Network error. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, submitResult, sessionId, answers]);

  useEffect(() => {
    if (timeLeft === 0 && !submitResult) {
      handleSubmit();
    }
  }, [timeLeft, submitResult, handleSubmit]);

  const handleAnswer = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleAddToSpacedRepetition = async () => {
    if (!submitResult || submitResult.missedWords.length === 0) return;
    try {
      const res = await fetch("/api/vocabulary/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: submitResult.missedWords,
          quality: 2,
        }),
      });
      if (res.ok) {
        setAddedToSR(true);
      } else {
        alert("Could not queue words to review.");
      }
    } catch {
      alert("Network error.");
    }
  };

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 font-semibold mb-3">{loadError}</p>
        <Link
          href="/vocabulary/custom-test"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Custom Test Setup
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading your test session...
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (submitResult) {
    const { score, maxScore, percentage, passed, results, missedWords } = submitResult;
    const displayedResults =
      reviewMode === "incorrect"
        ? results.filter((r) => !r.correct)
        : results;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score banner */}
        <div
          className={`rounded-2xl p-6 sm:p-8 text-center border mb-6 ${
            passed
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-white/80">
            {passed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {passed ? "Congratulations! Test Passed" : "Test Completed — Keep Practicing!"}
          </h1>
          <div className="text-5xl font-black my-3 text-slate-900">
            {percentage}%
          </div>
          <p className="text-sm opacity-80">
            You scored {score} out of {maxScore} questions correctly.
          </p>
        </div>

        {/* Action strip */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link
            href="/vocabulary/custom-test"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Create Another Test
          </Link>

          {missedWords.length > 0 && (
            <button
              onClick={handleAddToSpacedRepetition}
              disabled={addedToSR}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {addedToSR
                ? "Added to Spaced Repetition"
                : `Add ${missedWords.length} Missed Words to Spaced Review`}
            </button>
          )}

          <div className="ml-auto flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setReviewMode("all")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reviewMode === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setReviewMode("incorrect")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                reviewMode === "incorrect"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mistakes ({results.filter((r) => !r.correct).length})
            </button>
          </div>
        </div>

        {/* Question-by-question breakdown */}
        <div className="space-y-4">
          {displayedResults.map((r, i) => (
            <div
              key={r.questionId}
              className={`rounded-xl border p-5 ${
                r.correct
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    r.correct
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {r.correct ? "Correct" : "Incorrect"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Target Word: <strong className="text-slate-800">{r.targetWord}</strong>
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900 mb-2">
                {questions.find((q) => q.id === r.questionId)?.prompt}
              </div>

              <div className="text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Your answer: </span>
                  <span
                    className={`font-semibold ${
                      r.correct ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {r.userAnswer || "(No answer given)"}
                  </span>
                </div>
                {!r.correct && (
                  <div>
                    <span className="text-slate-500">Correct answer: </span>
                    <span className="font-semibold text-emerald-700">
                      {r.correctAnswer}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                <p className="font-medium text-slate-700">{r.explanation}</p>
                {r.exampleEn && (
                  <p className="mt-1 italic text-slate-500">
                    Example: "{r.exampleEn}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- RUNNER VIEW ---
  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{session.title}</h1>
          <p className="text-xs text-slate-500">
            {answeredCount} of {questions.length} questions answered
          </p>
        </div>
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              timeLeft < 60
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Question Number Strip */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((item, idx) => {
          const isAnswered = !!answers[item.id];
          const isCurrent = idx === currentIdx;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
                  : isAnswered
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      {q && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider mb-2">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span className="font-mono">{q.type}</span>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
            {q.prompt}
          </h2>

          {q.promptSub && (
            <p className="text-sm text-slate-600 italic mb-4">
              {q.promptSub}
            </p>
          )}

          {/* Answer Options */}
          {q.options && q.options.length > 0 ? (
            <div className="space-y-2.5 mt-4">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === opt;
                return (
                  <label
                    key={oi}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selected
                        ? "border-blue-500 bg-blue-50/70 text-blue-900 font-medium shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={selected}
                      onChange={() => handleAnswer(q.id, opt)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm leading-snug">{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <input
                type="text"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                placeholder="Type your answer here..."
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentIdx < questions.length - 1) {
                    setCurrentIdx((i) => i + 1);
                  }
                }}
              />
            </div>
          )}

          {q.hint && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hint: {q.hint}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          Previous
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || !isComplete}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting
            ? "Submitting..."
            : isComplete
            ? "Submit Test"
            : `Answer All (${questions.length - answeredCount} left)`}
        </button>

        <button
          onClick={() =>
            setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
          }
          disabled={currentIdx === questions.length - 1}
          className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
