import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnCurriculumPage() {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

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
              exercises: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Curriculum (A1 to B2)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Structured syllabus designed for continuous progression from Beginner to Upper Intermediate.
          </p>
        </div>
        <div>
          <Link
            href="/learn/generate"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Lesson with AI</span>
          </Link>
        </div>
      </div>

      {/* Levels list */}
      <div className="space-y-10">
        {levels.map((lvl) => {
          let totalLessons = 0;
          let completedLessons = 0;

          lvl.chapters.forEach((ch) => {
            ch.lessons.forEach((l) => {
              totalLessons += 1;
              if (
                l.lessonProgress.length > 0 &&
                l.lessonProgress[0].status === "completed"
              ) {
                completedLessons += 1;
              }
            });
          });

          const percent =
            totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return (
            <section
              key={lvl.id}
              id={lvl.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Level Header Banner */}
              <div className="bg-slate-50 border-b border-slate-200 p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black px-3 py-1 bg-blue-600 text-white rounded-md">
                    {lvl.id}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{lvl.name}</h2>
                    <p className="text-xs text-slate-500">{lvl.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700">
                      {completedLessons}/{totalLessons} completed ({percent}%)
                    </span>
                    <div className="w-28 sm:w-36 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters & Lessons */}
              <div className="p-5 sm:p-6 space-y-6">
                {lvl.chapters.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No chapters in this level yet.</p>
                ) : (
                  lvl.chapters.map((ch, chIdx) => (
                    <div key={ch.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Chapter {chIdx + 1}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base">{ch.title}</h3>
                          {ch.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{ch.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {ch.lessons.map((lesson) => {
                          const progress = lesson.lessonProgress[0];
                          const isDone = progress?.status === "completed";
                          const isInProgress = progress?.status === "in_progress";

                          return (
                            <Link
                              key={lesson.id}
                              href={`/learn/lesson/${lesson.id}`}
                              className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-slate-50 transition group"
                            >
                              <div className="flex items-center gap-3">
                                {isDone ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                ) : isInProgress ? (
                                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                                      {lesson.title}
                                    </span>
                                    {lesson.isCustomGenerated && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded border border-purple-200">
                                        AI Generated
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {lesson.exercises.length} practice exercises
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600">
                                <span className="text-xs font-medium hidden sm:inline-block">
                                  {isDone ? "Review" : "Start"}
                                </span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
