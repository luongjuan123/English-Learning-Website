"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GeneratedLesson } from "@/lib/ai/schemas";
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BookOpen,
} from "lucide-react";

interface ChapterOption {
  id: string;
  title: string;
  levelId: string;
}

export function GenerateLessonClient({
  chapters,
}: {
  chapters: ChapterOption[];
}) {
  const router = useRouter();

  // Form parameters
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [topic, setTopic] = useState("");
  const [lessonType, setLessonType] = useState<
    "grammar" | "vocabulary" | "reading" | "writing" | "listening" | "speaking" | "mixed"
  >("mixed");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate"
  );
  const [length, setLength] = useState<"short" | "standard" | "comprehensive">("standard");

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // Saving state
  const [selectedChapterId, setSelectedChapterId] = useState<string>("new");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter chapters by selected level
  const filteredChapters = chapters.filter((c) => c.levelId === level);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic or learning objective.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          topic: topic.trim(),
          lessonType,
          difficulty,
          length,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation request failed");
      }

      setGeneratedLesson(data.lesson);
      setIsFallback(Boolean(data.isFallback));
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedLesson) return;

    setSaving(true);
    try {
      const res = await fetch("/api/ai/save-generated-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level,
          chapterId: selectedChapterId,
          newChapterTitle:
            selectedChapterId === "new"
              ? newChapterTitle.trim() || `Custom ${level} Topics`
              : undefined,
          lesson: generatedLesson,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save lesson");
      }

      router.push(`/learn/lesson/${data.lessonId}`);
    } catch (err: any) {
      alert(err.message || "Could not save lesson to curriculum");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curriculum</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Lesson Generator
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Dynamically generate level-tailored chapters, explanations, bilingual examples, and exercises using structured LLM synthesis.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CEFR Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target CEFR Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="A1">A1 — Beginner</option>
                <option value="A2">A2 — Elementary</option>
                <option value="B1">B1 — Intermediate</option>
                <option value="B2">B2 — Upper Intermediate</option>
              </select>
            </div>

            {/* Lesson Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lesson Type
              </label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mixed">Mixed (Grammar + Vocab + Practice)</option>
                <option value="grammar">Grammar Focus</option>
                <option value="vocabulary">Vocabulary & Phrases Focus</option>
                <option value="reading">Reading Comprehension Focus</option>
                <option value="writing">Writing & Sentence Structure</option>
                <option value="listening">Listening & Pronunciation</option>
              </select>
            </div>
          </div>

          {/* Topic / Learning Goal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Topic or Learning Goal
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Asking for Directions, Job Interviews, Passive Voice in News Articles..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Be specific or general. The AI will adapt the vocabulary and grammar depth to {level}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Relative Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Gentle / Foundational</option>
                <option value="intermediate">Standard / Balanced</option>
                <option value="advanced">Challenging / Deep Nuance</option>
              </select>
            </div>

            {/* Scope / Length */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Scope / Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="short">Short (Quick 5-min drill)</option>
                <option value="standard">Standard (Comprehensive lesson)</option>
                <option value="comprehensive">In-Depth (Extensive rules & exercises)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating structured lesson with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Lesson</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Lesson Preview */}
      {generatedLesson && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                  {level} Preview
                </span>
                {isFallback && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    Offline Template Generator
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{generatedLesson.title}</h2>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          {/* Objectives */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Objectives:
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {generatedLesson.objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Grammar Explanation Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Grammar & Topic Explanation:
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs whitespace-pre-wrap text-slate-800 leading-relaxed font-sans markdown-body">
              {generatedLesson.grammarExplanation}
            </div>
          </div>

          {/* Vietnamese notes */}
          {generatedLesson.vietnameseNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
              <strong>Ghi chú tiếng Việt: </strong>
              {generatedLesson.vietnameseNotes}
            </div>
          )}

          {/* Exercises Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Generated Exercises ({generatedLesson.exercises.length}):
            </h3>
            <div className="space-y-3">
              {generatedLesson.exercises.map((ex, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50">
                  <div className="font-semibold text-slate-900">
                    {i + 1}. {ex.prompt}
                  </div>
                  {ex.promptVn && <div className="text-slate-500 italic mt-0.5">{ex.promptVn}</div>}
                  <div className="text-emerald-700 font-medium mt-1">
                    Answer: {ex.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save to Curriculum Controls */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Save to Permanent Curriculum</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assign to Chapter in {level}
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="new">+ Create New Chapter</option>
                  {filteredChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedChapterId === "new" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Chapter Title
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder={`e.g. ${topic || "Advanced Topics"}`}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Lesson into Curriculum & Start Studying</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
