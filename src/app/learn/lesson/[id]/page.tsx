import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LessonInteractive } from "./LessonInteractive";
import { ArrowLeft, BookOpen, CheckCircle, Info } from "lucide-react";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: { id: string };
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const user = await prisma.user.findFirst();
  const userId = user?.id || "default-student";

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      chapter: {
        include: {
          level: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, orderIndex: true },
          },
        },
      },
      exercises: {
        orderBy: { orderIndex: "asc" },
      },
      lessonProgress: {
        where: { userId },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Parse objectives
  let objectives: string[] = [];
  try {
    objectives = JSON.parse(lesson.objectives);
  } catch {
    objectives = [lesson.objectives];
  }

  // Find next lesson
  const allLessonsInChapter = lesson.chapter.lessons;
  const currentIndex = allLessonsInChapter.findIndex((l) => l.id === lesson.id);
  const nextLessonId =
    currentIndex !== -1 && currentIndex + 1 < allLessonsInChapter.length
      ? allLessonsInChapter[currentIndex + 1].id
      : null;

  // Fetch relevant vocabulary for this CEFR level
  const vocabularyList = await prisma.vocabularyWord.findMany({
    where: { cefrLevel: lesson.chapter.levelId },
    take: 6,
  });

  const isCompleted =
    lesson.lessonProgress.length > 0 &&
    lesson.lessonProgress[0].status === "completed";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curriculum</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
            Level {lesson.chapter.levelId}
          </span>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs text-slate-600 font-medium">{lesson.chapter.title}</span>
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md">
                Chapter: {lesson.chapter.title}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Objectives */}
        {objectives.length > 0 && (
          <div className="mt-5 p-4 bg-blue-50/60 border border-blue-100 rounded-lg">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">
              Learning Objectives:
            </h2>
            <ul className="space-y-1.5 text-xs text-blue-950">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Grammar & Language Concept Explanation */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Grammar & Language Concept</span>
          </h2>

          {/* Formatted Markdown Explanation */}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap markdown-body">
            {lesson.grammarExplanation}
          </div>
        </div>

        {/* Vietnamese Notes & Common Pitfalls */}
        {lesson.vietnameseNotes && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Ghi chú ngữ pháp & Lưu ý lỗi sai cho người Việt:</span>
            </h3>
            <p className="text-xs text-amber-950 leading-relaxed">
              {lesson.vietnameseNotes}
            </p>
          </div>
        )}
      </section>

      {/* Interactive Component for Vocab, Reading, Audio, and Practice Exercises */}
      <LessonInteractive
        lessonId={lesson.id}
        initialCompleted={isCompleted}
        cefrLevel={lesson.chapter.levelId}
        readingPassage={lesson.readingPassage}
        readingPassageVn={lesson.readingPassageVn}
        listeningScript={lesson.listeningScript}
        exercises={lesson.exercises}
        vocabularyList={vocabularyList}
        nextLessonId={nextLessonId}
      />
    </div>
  );
}
