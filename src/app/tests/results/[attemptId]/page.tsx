import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  Award,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ResultsPageProps {
  params: { attemptId: string };
}

export default async function TestResultPage({ params }: ResultsPageProps) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      test: {
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  // Parse feedback and weak topics
  let feedbackItems: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    topic: string;
  }> = [];

  try {
    if (attempt.feedbackJson) {
      feedbackItems = JSON.parse(attempt.feedbackJson);
    }
  } catch {}

  let weakTopics: string[] = [];
  try {
    if (attempt.weakTopicsJson) {
      weakTopics = JSON.parse(attempt.weakTopicsJson);
    }
  } catch {}

  // Find recommended lessons based on weak topics
  const recommendedLessons = await prisma.lesson.findMany({
    where: {
      OR: weakTopics.map((t) => ({
        title: { contains: t },
      })),
    },
    take: 3,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Practice Tests</span>
        </Link>
      </div>

      {/* Main Score Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <div
          className={`inline-flex p-3 rounded-full ${
            attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          <Award className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
            {attempt.test.category.replace(/_/g, " ")} • {attempt.test.cefrLevel}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{attempt.test.title}</h1>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <div>
            <div className="text-4xl font-black text-blue-600">{attempt.percentage}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Final Score</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {attempt.score} / {attempt.maxScore}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Correct Answers</div>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <div
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                attempt.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {attempt.passed ? "PASSED" : "NEEDS PRACTICE"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Passing: {attempt.test.passingScore}%</div>
          </div>
        </div>
      </div>

      {/* Weak Topics & Recommended Next Steps */}
      {weakTopics.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Identified Weak Topics to Strengthen:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((topic, i) => (
              <span
                key={i}
                className="text-xs font-semibold px-2.5 py-1 bg-white text-amber-950 border border-amber-300 rounded-md"
              >
                {topic}
              </span>
            ))}
          </div>

          {recommendedLessons.length > 0 && (
            <div className="pt-3 border-t border-amber-200/60 space-y-2">
              <span className="text-xs font-semibold text-amber-900 block">
                Recommended review lessons:
              </span>
              <div className="space-y-1.5">
                {recommendedLessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/learn/lesson/${l.id}`}
                    className="flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-blue-400 text-xs transition"
                  >
                    <span className="font-semibold text-slate-800">{l.title}</span>
                    <span className="text-blue-600 font-medium flex items-center gap-1">
                      Review Lesson <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Question Review */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900">Detailed Question-by-Question Review</h2>

        <div className="space-y-4">
          {attempt.test.questions.map((q, idx) => {
            const fb = feedbackItems.find((f) => f.questionId === q.id);
            const isCorrect = fb ? fb.isCorrect : false;
            const userAnswer = fb?.userAnswer || "(no answer)";

            return (
              <div
                key={q.id}
                className={`border rounded-xl p-4 sm:p-5 text-xs transition ${
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-rose-200 bg-rose-50/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-slate-500">Question {idx + 1}</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      isCorrect ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 text-sm mb-2">{q.question}</div>

                <div className="space-y-1 text-slate-700 bg-white/70 p-3 rounded-lg border border-slate-200/60">
                  <div>
                    Your answer: <strong className={isCorrect ? "text-emerald-800" : "text-rose-800"}>{userAnswer}</strong>
                  </div>
                  {!isCorrect && (
                    <div>
                      Correct answer: <strong className="text-slate-900">{q.correctAnswer}</strong>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/tests/${attempt.test.id}`}
          className="px-5 py-2.5 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs hover:bg-slate-200"
        >
          Retake Test
        </Link>
        <Link
          href="/progress"
          className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 inline-flex items-center gap-1.5"
        >
          <span>View Updated Progress</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
