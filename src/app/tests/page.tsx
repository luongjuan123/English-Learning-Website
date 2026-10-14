import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Award,
  BookOpen,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PracticeTestsPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  // Fetch available tests
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      questions: { select: { id: true } },
      attempts: {
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
    },
  });

  // Fetch past attempts for history
  const attempts = await prisma.testAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    include: { test: true },
    take: 15,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Practice & Placement Tests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Assess your proficiency across A1 to B2 with automated grading, mistake reviews, and targeted recommendations.
          </p>
        </div>
      </div>

      {/* Available Tests Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Available Standard Assessments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => {
            const lastAttempt = test.attempts[0];

            return (
              <div
                key={test.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">
                      {test.cefrLevel} Level
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {test.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{test.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {test.description || "Comprehensive assessment testing key grammar, vocabulary, and sentence structure."}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {test.timeLimitMinutes} mins
                    </span>
                    <span>{test.questions.length} questions</span>
                    <span>Passing: {test.passingScore}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {lastAttempt ? (
                    <div className="text-xs">
                      <span className="text-slate-500">Last attempt: </span>
                      <strong
                        className={lastAttempt.passed ? "text-emerald-700" : "text-rose-700"}
                      >
                        {lastAttempt.percentage}% ({lastAttempt.passed ? "Passed" : "Failed"})
                      </strong>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not taken yet</span>
                  )}

                  <Link
                    href={`/tests/${test.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                  >
                    <span>{lastAttempt ? "Retake Test" : "Start Test"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test History Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Your Test History</span>
        </h2>

        {attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Test Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {att.test.title}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize">
                      {att.test.category.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {att.score} / {att.maxScore} ({att.percentage}%)
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.passed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {att.passed ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Needs Practice
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(att.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/tests/results/${att.id}`}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        View Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No tests taken yet. Start with the CEFR Diagnostic Placement Test above!
          </div>
        )}
      </div>
    </div>
  );
}
