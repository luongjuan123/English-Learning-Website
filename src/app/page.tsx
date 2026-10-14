import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  // 1. Fetch levels with lessons and progress
  const levels = await prisma.level.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: {
              lessonProgress: {
                where: { userId },
              },
            },
          },
        },
      },
    },
  });

  // Calculate progress per level
  const levelStats = levels.map((lvl) => {
    let totalLessons = 0;
    let completedLessons = 0;

    lvl.chapters.forEach((ch) => {
      ch.lessons.forEach((l) => {
        totalLessons += 1;
        if (l.lessonProgress.length > 0 && l.lessonProgress[0].status === "completed") {
          completedLessons += 1;
        }
      });
    });

    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      id: lvl.id,
      name: lvl.name,
      description: lvl.description,
      totalLessons,
      completedLessons,
      percent,
    };
  });

  // 2. Vocabulary stats
  const totalVocab = await prisma.userVocabulary.count({
    where: { userId },
  });
  const masteredVocab = await prisma.userVocabulary.count({
    where: { userId, status: "mastered" },
  });
  const now = new Date();
  const dueVocabCount = await prisma.userVocabulary.count({
    where: {
      userId,
      nextReviewDate: { lte: now },
    },
  });

  // 3. Test stats
  const testAttempts = await prisma.testAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    include: { test: true },
    take: 5,
  });

  const totalTestsTaken = await prisma.testAttempt.count({ where: { userId } });
  const avgTestScore =
    totalTestsTaken > 0
      ? Math.round(
          (
            await prisma.testAttempt.aggregate({
              where: { userId },
              _avg: { percentage: true },
            })
          )._avg.percentage || 0
        )
      : 0;

  // 4. Total completed lessons
  const totalCompletedLessons = await prisma.lessonProgress.count({
    where: { userId, status: "completed" },
  });

  // 5. Find next recommended lesson
  let nextLesson: { id: string; title: string; levelId: string; chapterTitle: string } | null = null;
  for (const lvl of levels) {
    for (const ch of lvl.chapters) {
      for (const l of ch.lessons) {
        const isDone =
          l.lessonProgress.length > 0 && l.lessonProgress[0].status === "completed";
        if (!isDone) {
          nextLesson = {
            id: l.id,
            title: l.title,
            levelId: lvl.id,
            chapterTitle: ch.title,
          };
          break;
        }
      }
      if (nextLesson) break;
    }
    if (nextLesson) break;
  }

  // 6. Recent lesson activity
  const recentProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { lastStudiedAt: "desc" },
    include: { lesson: { include: { chapter: { include: { level: true } } } } },
    take: 4,
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Student Greeting */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full mb-2">
              <span>Target Level: {user?.targetLevel || "B2"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || "Student"}!
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Your estimated proficiency is currently at{" "}
              <strong className="text-blue-700 font-bold">{user?.currentCefr || "A1"}</strong>.
              Keep practicing consistently to advance toward{" "}
              <strong>{user?.targetLevel || "B2"}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            {nextLesson ? (
              <Link
                href={`/learn/lesson/${nextLesson.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm text-sm"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/learn"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm text-sm"
              >
                <span>View Curriculum</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/vocabulary/flashcards"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-800 font-medium rounded-lg hover:bg-slate-200 transition text-sm border border-slate-300"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Review ({dueVocabCount} due)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Lessons */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Lessons
            </span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {totalCompletedLessons}
          </div>
          <p className="text-xs text-slate-500 mt-1">Structured curriculum units</p>
        </div>

        {/* Vocabulary Mastered */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vocabulary Words
            </span>
            <Layers className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {totalVocab} <span className="text-sm font-normal text-slate-500">({masteredVocab} mastered)</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {dueVocabCount} due for SM-2 review
          </p>
        </div>

        {/* Test Performance */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tests Average
            </span>
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {avgTestScore}%
          </div>
          <p className="text-xs text-slate-500 mt-1">{totalTestsTaken} tests completed</p>
        </div>

        {/* Daily Study Streak */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Study Streak
            </span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {user?.streakDays || 0} <span className="text-sm font-normal text-slate-500">days</span>
          </div>
          <p className="text-xs text-amber-600 mt-1 font-medium">Daily practice active</p>
        </div>
      </div>

      {/* CEFR Level Progress Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">CEFR Learning Progress</h2>
            <p className="text-xs text-slate-500">Progress across all four language proficiency bands</p>
          </div>
          <Link href="/learn" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Explore All Levels →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levelStats.map((lvl) => (
            <div
              key={lvl.id}
              className={`bg-white border rounded-xl p-5 shadow-sm transition hover:border-blue-400 ${
                lvl.id === user?.currentCefr ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-800 rounded">
                  {lvl.id}
                </span>
                <span className="text-sm font-semibold text-slate-700">{lvl.percent}%</span>
              </div>
              <h3 className="font-bold text-slate-900 mt-2 text-base">{lvl.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{lvl.description}</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${lvl.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>
                  {lvl.completedLessons}/{lvl.totalLessons} lessons
                </span>
                <Link
                  href={`/learn#${lvl.id}`}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Start →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Up & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Next Lesson */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Recommended Next Lesson</span>
          </h2>

          {nextLesson ? (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded mr-2">
                  {nextLesson.levelId}
                </span>
                <span className="text-xs text-slate-500 font-medium">{nextLesson.chapterTitle}</span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{nextLesson.title}</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Grammar explanation, bilingual examples, vocabulary, and interactive quiz.
                </p>
              </div>
              <Link
                href={`/learn/lesson/${nextLesson.id}`}
                className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5 justify-center"
              >
                <span>Study Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-4">
              All currently available lessons completed! You can generate new custom lessons via the AI Generator.
            </p>
          )}

          {/* Quick links strip */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Study Tools
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/vocabulary/flashcards"
                className="p-3 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition"
              >
                <Layers className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 block">Flashcards</span>
                <span className="text-[10px] text-slate-500">{dueVocabCount} due</span>
              </Link>

              <Link
                href="/vocabulary/test"
                className="p-3 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition"
              >
                <GraduationCap className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 block">Vocab Quiz</span>
                <span className="text-[10px] text-slate-500">Test memory</span>
              </Link>

              <Link
                href="/tests"
                className="p-3 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition"
              >
                <FileText className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 block">Practice Test</span>
                <span className="text-[10px] text-slate-500">Grammar & reading</span>
              </Link>

              <Link
                href="/practice"
                className="p-3 border border-slate-200 rounded-lg text-center hover:bg-slate-50 transition"
              >
                <TrendingUp className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-slate-800 block">Writing AI</span>
                <span className="text-[10px] text-slate-500">Get feedback</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Test Attempts / Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Recent Test Results</span>
            <Link href="/tests" className="text-xs text-blue-600 font-medium hover:underline">
              View all
            </Link>
          </h2>

          {testAttempts.length > 0 ? (
            <div className="space-y-3">
              {testAttempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/tests/results/${attempt.id}`}
                  className="block p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {attempt.test.title}
                    </span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        attempt.passed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {attempt.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Score: {attempt.score}/{attempt.maxScore}
                    </span>
                    <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">No tests taken yet</p>
              <Link
                href="/tests"
                className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 hover:bg-blue-100"
              >
                Take Placement Test
              </Link>
            </div>
          )}

          {/* Recent Lesson Activity */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recent Lesson History
            </h3>
            {recentProgress.length > 0 ? (
              <div className="space-y-2">
                {recentProgress.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none"
                  >
                    <span className="text-slate-800 font-medium line-clamp-1">
                      {item.lesson.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No lessons studied yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
