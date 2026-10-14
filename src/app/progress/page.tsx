import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  BarChart2,
  BookOpen,
  Award,
  Layers,
  Flame,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  // 1. Lessons progress
  const totalLessons = await prisma.lesson.count();
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, status: "completed" },
  });
  const inProgressLessons = await prisma.lessonProgress.count({
    where: { userId, status: "in_progress" },
  });

  // 2. Vocabulary stats
  const totalVocab = await prisma.userVocabulary.count({ where: { userId } });
  const newVocab = await prisma.userVocabulary.count({ where: { userId, status: "new" } });
  const learningVocab = await prisma.userVocabulary.count({ where: { userId, status: "learning" } });
  const familiarVocab = await prisma.userVocabulary.count({ where: { userId, status: "familiar" } });
  const masteredVocab = await prisma.userVocabulary.count({ where: { userId, status: "mastered" } });

  // 3. Test attempts & weak topics
  const attempts = await prisma.testAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    include: { test: true },
  });

  const weakTopicCounts: Record<string, number> = {};
  attempts.forEach((att) => {
    if (att.weakTopicsJson) {
      try {
        const topics: string[] = JSON.parse(att.weakTopicsJson);
        topics.forEach((t) => {
          weakTopicCounts[t] = (weakTopicCounts[t] || 0) + 1;
        });
      } catch {}
    }
  });

  const sortedWeakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, count]) => ({ topic: t, count }));

  // 4. Estimated CEFR calculation
  // Check passed level assessments
  let estimatedLevel = "A1";
  const passedLevels = new Set(
    attempts.filter((a) => a.passed).map((a) => a.test.cefrLevel)
  );

  if (passedLevels.has("B2")) {
    estimatedLevel = "B2";
  } else if (passedLevels.has("B1")) {
    estimatedLevel = "B1";
  } else if (passedLevels.has("A2")) {
    estimatedLevel = "A2";
  } else {
    estimatedLevel = "A1";
  }

  // Update user currentCefr if changed
  if (user && user.currentCefr !== estimatedLevel) {
    await prisma.user.update({
      where: { id: user.id },
      data: { currentCefr: estimatedLevel },
    });
  }

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Learning Analytics & Progress
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Detailed metrics tracking your journey from Beginner (A1) to Upper Intermediate (B2).
        </p>
      </div>

      {/* CEFR Assessment Banner with Pedagogical Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Evaluated Proficiency
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-blue-600">
                Level {estimatedLevel}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Target: {user?.targetLevel || "B2"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tests"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
            >
              Take Level Assessment
            </Link>
          </div>
        </div>

        {/* Pedagogical Disclaimer Alert */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Evaluation Standard:</strong> Language level estimates are calculated
            specifically from objective assessment scores and placement tests, rather than simply
            counting viewed lessons. This estimate is approximate and serves to guide your study focus.
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Completed Lessons
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {completedLessons} / {totalLessons}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{
                width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vocabulary Mastered
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {masteredVocab} / {totalVocab}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {familiarVocab} familiar, {learningVocab} learning
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Test Performance
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{avgScore}%</div>
          <p className="text-xs text-slate-500 mt-2">{attempts.length} total assessments taken</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Study Streak
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 flex items-center gap-1.5">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>{user?.streakDays || 0} days</span>
          </div>
          <p className="text-xs text-amber-600 mt-2 font-medium">Consecutive practice</p>
        </div>
      </div>

      {/* Vocabulary Retention Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Vocabulary Retention & Mastery Distribution</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="text-2xl font-bold text-blue-700">{newVocab}</div>
            <div className="text-xs font-semibold text-blue-900 mt-1">New</div>
            <div className="text-[10px] text-blue-600">Pending review</div>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <div className="text-2xl font-bold text-amber-700">{learningVocab}</div>
            <div className="text-xs font-semibold text-amber-900 mt-1">Learning</div>
            <div className="text-[10px] text-amber-600">1–2 reviews</div>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl">
            <div className="text-2xl font-bold text-indigo-700">{familiarVocab}</div>
            <div className="text-xs font-semibold text-indigo-900 mt-1">Familiar</div>
            <div className="text-[10px] text-indigo-600">3–4 reviews</div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <div className="text-2xl font-bold text-emerald-700">{masteredVocab}</div>
            <div className="text-xs font-semibold text-emerald-900 mt-1">Mastered</div>
            <div className="text-[10px] text-emerald-600">5+ consecutive recalls</div>
          </div>
        </div>
      </div>

      {/* Weak Grammar Topics to Target */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Areas for Improvement (Mistake Tracker)</span>
        </h2>

        {sortedWeakTopics.length > 0 ? (
          <div className="space-y-2">
            {sortedWeakTopics.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900">{item.topic}</span>
                  <span className="text-xs text-rose-600 ml-2">
                    ({item.count} mistake{item.count > 1 ? "s" : ""})
                  </span>
                </div>
                <Link
                  href="/learn"
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  Review Curriculum <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            No weak topics recorded yet! Take practice tests to discover areas to improve.
          </p>
        )}
      </div>

      {/* Test Trajectory History */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
          <span>Assessment Scores History</span>
          <Link href="/tests" className="text-xs text-blue-600 font-bold hover:underline">
            Take Another Test →
          </Link>
        </h2>

        {attempts.length > 0 ? (
          <div className="space-y-3">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="p-3.5 border border-slate-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{att.test.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {att.test.cefrLevel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(att.completedAt).toLocaleDateString()} • {att.score}/{att.maxScore} correct
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-black px-2.5 py-1 rounded-md ${
                      att.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {att.percentage}%
                  </span>
                  <Link
                    href={`/tests/results/${att.id}`}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            No test attempts completed yet.
          </p>
        )}
      </div>
    </div>
  );
}
