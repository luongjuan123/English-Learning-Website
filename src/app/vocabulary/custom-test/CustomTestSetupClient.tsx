"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Settings2, Sparkles, Check, Trash2, Bookmark } from "lucide-react";

interface SavedList {
  id: string;
  name: string;
  description: string;
  words: string[];
  updatedAt: string;
}

const QUESTION_TYPES = [
  { value: "mixed", label: "Mixed (Recommended)" },
  { value: "en_to_vn", label: "English to Vietnamese" },
  { value: "vn_to_en", label: "Vietnamese to English" },
  { value: "vocab_mcq", label: "Definition Match (MCQ)" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "type_answer", label: "Type the Answer" },
];

function parseWords(raw: string): string[] {
  const lines = raw
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of lines) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(w);
    }
  }
  return result;
}

export default function CustomTestSetupClient() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [parsedWords, setParsedWords] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [difficulty, setDifficulty] = useState("auto");
  const [language, setLanguage] = useState("vi");
  const [shuffle, setShuffle] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [listName, setListName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/vocabulary/saved-lists")
      .then((r) => r.json())
      .then((d) => setSavedLists(d.lists ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const words = parseWords(rawInput);
    const filtered = words.filter((_, i) => !removedIndices.has(i));
    setParsedWords(filtered);
    setQuestionCount((prev) => Math.min(Math.max(1, filtered.length || 5), 20));
  }, [rawInput, removedIndices]);

  const handleRemoveWord = (idx: number) => {
    setRemovedIndices((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const handleLoadList = (list: SavedList) => {
    setRawInput(list.words.join("\n"));
    setListName(list.name);
    setRemovedIndices(new Set());
    setSaveMsg("");
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      setSaveMsg("Please enter a name for this list.");
      return;
    }
    if (parsedWords.length === 0) {
      setSaveMsg("No words to save.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vocabulary/saved-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listName.trim(), words: parsedWords }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error ?? "Save failed.");
      } else {
        setSaveMsg(`Saved as "${data.list.name}"!`);
        setSavedLists((prev) => [data.list, ...prev]);
      }
    } catch {
      setSaveMsg("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (parsedWords.length === 0) {
      setError("Please paste at least one word.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/vocabulary/custom-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: parsedWords,
          config: {
            questionType,
            questionCount,
            timeLimitMinutes,
            difficulty,
            language,
            shuffle,
            showHints,
          },
          title: listName.trim() || `Custom Test (${parsedWords.length} words)`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate test.");
        setLoading(false);
        return;
      }
      router.push(`/vocabulary/custom-test/${data.sessionId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const allWords = parseWords(rawInput);
  const displayWords = allWords.filter((_, i) => !removedIndices.has(i));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/vocabulary" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Vocabulary Test</h1>
          <p className="text-sm text-slate-600 mt-1">
            Paste any list of English words or phrases to generate a personalized practice test.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input + Word List */}
        <div className="lg:col-span-2 space-y-5">
          {/* Saved lists picker */}
          {savedLists.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span>Load a Saved List</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedLists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLoadList(l)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-400">({l.words.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paste Words Area */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800">
                Paste Words or Phrases
              </label>
              <span className="text-xs text-slate-500">
                {displayWords.length} unique words
              </span>
            </div>
            <textarea
              className="w-full h-48 border border-slate-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder={`hello\nhi\ndog\ncat\niguana\nsomething\nlook forward to`}
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                setRemovedIndices(new Set());
              }}
            />
            <p className="text-xs text-slate-500 mt-2">
              Accepts one word per line, comma-separated lists, or mixed. Duplicates are filtered automatically.
            </p>
          </div>

          {/* Word Preview Chips */}
          {displayWords.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Words in Test ({displayWords.length})
                </h2>
                {removedIndices.size > 0 && (
                  <button
                    onClick={() => setRemovedIndices(new Set())}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Restore all removed
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {allWords.map((w, i) => {
                  if (removedIndices.has(i)) return null;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200"
                    >
                      <span>{w}</span>
                      <button
                        onClick={() => handleRemoveWord(i)}
                        className="text-blue-400 hover:text-red-500 font-bold leading-none"
                        title="Remove word"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save List Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Save This Word List (Optional)</h2>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='e.g. "Work Meetings", "IELTS Reading 1"'
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
              <button
                onClick={handleSaveList}
                disabled={saving || displayWords.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save List"}
              </button>
            </div>
            {saveMsg && (
              <p className={`text-xs mt-2 ${saveMsg.startsWith("Saved") ? "text-green-600" : "text-red-500"}`}>
                {saveMsg}
              </p>
            )}
          </div>
        </div>

        {/* Right: Test Configuration */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings2 className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-800">Test Settings</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Question Type
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Question Count
                </label>
                <span className="text-xs font-bold text-blue-700">{questionCount}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, Math.min(50, displayWords.length > 0 ? displayWords.length * 2 : 20))}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1</span>
                <span>{Math.max(1, Math.min(50, displayWords.length > 0 ? displayWords.length * 2 : 20))}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="auto">Auto (Adaptive)</option>
                <option value="easy">Easy (More hints)</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard (Strict)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Language for Prompts
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="vi">Vietnamese Prompts (Tiếng Việt)</option>
                <option value="en">English Prompts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Time Limit (Minutes, 0 = untimed)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-700">Shuffle question order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHints}
                  onChange={(e) => setShowHints(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-700">Show helpful hints</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || displayWords.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <span>Generating Test...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Test ({displayWords.length} words)</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
