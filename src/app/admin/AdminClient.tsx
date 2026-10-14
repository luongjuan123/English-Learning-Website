"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react";

interface ChapterLesson {
  id: string;
  title: string;
  isCustomGenerated: boolean;
}

interface ChapterData {
  id: string;
  title: string;
  levelId: string;
  lessons: ChapterLesson[];
}

export function AdminClient({ chapters }: { chapters: ChapterData[] }) {
  const router = useRouter();
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Reset states
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Delete lesson
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete lesson "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/delete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      if (res.ok) {
        alert("Lesson deleted successfully");
        router.refresh();
      } else {
        alert("Failed to delete lesson");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Export JSON
  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/export-data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `english-platform-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export data");
    }
  };

  // Import JSON
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    setImporting(true);
    setImportSuccess(null);

    try {
      const parsed = JSON.parse(importJson);
      const words = Array.isArray(parsed) ? parsed : parsed.vocabularyWords || [];

      const res = await fetch("/api/admin/import-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyWords: words }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportSuccess(`Successfully imported ${data.importedCount} vocabulary words!`);
        setImportJson("");
        router.refresh();
      } else {
        alert(data.error || "Import failed");
      }
    } catch (err: any) {
      alert("Invalid JSON format: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Reset progress
  const handleReset = async (target: "test_attempts" | "lesson_progress" | "all_progress") => {
    const confirmationText =
      target === "test_attempts"
        ? "delete all test attempt history"
        : target === "lesson_progress"
        ? "reset all completed lessons and streak"
        : "reset ALL study progress and test records";

    if (!confirm(`CAUTION: Are you sure you want to ${confirmationText}?`)) {
      return;
    }

    setResetting(true);
    setResetSuccess(null);

    try {
      const res = await fetch("/api/admin/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message);
        router.refresh();
      } else {
        alert(data.error || "Reset failed");
      }
    } catch (err) {
      alert("Error resetting progress");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>Content Management & Administration</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Simple controls for managing chapters, lessons, batch data imports, backups, and progress resets.
        </p>
      </div>

      {/* Curriculum Manager */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Curriculum & Lessons Manager</span>
            </h2>
            <p className="text-xs text-slate-500">
              Inspect chapters and remove custom AI-generated or outdated lessons.
            </p>
          </div>
          <Link
            href="/learn/generate"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New Lesson</span>
          </Link>
        </div>

        <div className="space-y-4 pt-2">
          {chapters.map((ch) => (
            <div key={ch.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  [{ch.levelId}] {ch.title}
                </span>
                <span className="text-[11px] text-slate-500">{ch.lessons.length} lessons</span>
              </div>

              <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                {ch.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/learn/lesson/${lesson.id}`}
                        className="font-semibold text-slate-800 hover:text-blue-600"
                      >
                        {lesson.title}
                      </Link>
                      {lesson.isCustomGenerated && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded border border-purple-200">
                          AI
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup, Export & Import */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-600" />
          <span>Data Export & Import (JSON)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Export Box */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Export Learning Bank
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download your complete vocabulary bank, collocations, definitions, and curriculum structure into a single JSON file for offline backup.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Batch Import Vocabulary
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Paste a JSON array of vocabulary items ([&#123;&quot;word&quot;: &quot;...&quot;, &quot;defVn&quot;: &quot;...&quot;&#125;]) to bulk-insert terms.
            </p>

            {importSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <form onSubmit={handleImport} className="space-y-2">
              <textarea
                rows={3}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"word": "innovative", "pos": "adjective", "defEn": "featuring new methods", "defVn": "đổi mới, sáng tạo", "cefrLevel": "B2"}]'
                className="w-full text-xs font-mono border border-slate-300 rounded p-2 text-slate-900 bg-white"
              />
              <button
                type="submit"
                disabled={importing || !importJson.trim()}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? "Importing..." : "Import Vocabulary"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Progress */}
      <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Danger Zone / Reset Controls</span>
          </h2>
          <p className="text-xs text-slate-500">
            Reset test attempts or completed lesson logs if you want to restart studying from scratch.
          </p>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={resetting}
            onClick={() => handleReset("test_attempts")}
            className="p-3 border border-rose-300 bg-rose-50 text-rose-900 rounded-lg text-xs font-bold hover:bg-rose-100 transition disabled:opacity-50 text-left"
          >
            <div className="font-bold">Reset Test History</div>
            <div className="text-[10px] text-rose-700 font-normal mt-0.5">
              Deletes past attempts & clears weak topics
            </div>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={() => handleReset("lesson_progress")}
            className="p-3 border border-rose-300 bg-rose-50 text-rose-900 rounded-lg text-xs font-bold hover:bg-rose-100 transition disabled:opacity-50 text-left"
          >
            <div className="font-bold">Reset Lesson Progress</div>
            <div className="text-[10px] text-rose-700 font-normal mt-0.5">
              Resets completed lessons and streak
            </div>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={() => handleReset("all_progress")}
            className="p-3 border border-rose-400 bg-rose-100 text-rose-950 rounded-lg text-xs font-bold hover:bg-rose-200 transition disabled:opacity-50 text-left"
          >
            <div className="font-bold">Reset All Progress</div>
            <div className="text-[10px] text-rose-800 font-normal mt-0.5">
              Full reset of streak, lessons, and tests
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
