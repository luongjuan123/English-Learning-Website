"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Download, Save, Layers, BookOpen, Edit2, Trash2, Check, X } from "lucide-react";

interface EnrichedWord {
  word: string;
  ipa: string;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
  cefrEstimate: string;
  synonyms: string[];
  collocations: string[];
  usageNote: string;
}

function parseWords(raw: string): string[] {
  const tokens = raw
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of tokens) {
    const key = w.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(w);
    }
  }
  return result;
}

const CEFR_LEVELS = ["auto", "A1", "A2", "B1", "B2"];

export default function CustomVocabClient() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [cefrLevel, setCefrLevel] = useState("auto");
  const [enriched, setEnriched] = useState<EnrichedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedCollectionId, setSavedCollectionId] = useState<string | null>(null);

  // Inline editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<Partial<EnrichedWord>>({});

  const parsedWords = parseWords(rawInput);

  const handleGenerate = useCallback(async () => {
    if (parsedWords.length === 0) {
      setError("Please paste at least one word.");
      return;
    }
    setError("");
    setLoading(true);
    setEnriched([]);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/vocabulary/custom-vocab/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: parsedWords,
          cefrLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to enrich vocabulary.");
      } else {
        setEnriched(data.enriched ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [parsedWords, cefrLevel]);

  const handleRemove = (idx: number) => {
    setEnriched((prev) => prev.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditBuffer({ ...enriched[idx] });
  };

  const saveEdit = (idx: number) => {
    setEnriched((prev) =>
      prev.map((w, i) => (i === idx ? ({ ...w, ...editBuffer } as EnrichedWord) : w))
    );
    setEditingIdx(null);
    setEditBuffer({});
  };

  const handleSave = async () => {
    if (!collectionName.trim()) {
      alert("Please give this vocabulary collection a name.");
      return;
    }
    if (enriched.length === 0) {
      alert("No words to save.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vocabulary/custom-vocab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collectionName.trim(),
          cefrLevel,
          enrichedWords: enriched,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Save failed.");
      } else {
        setSaveSuccess(true);
        setSavedCollectionId(data.collection.id);
      }
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const header = "word,ipa,pos,defEn,defVn,exampleEn,exampleVn,cefrEstimate,synonyms,collocations";
    const rows = enriched.map((w) =>
      [
        w.word,
        w.ipa,
        w.pos,
        w.defEn,
        w.defVn,
        w.exampleEn,
        w.exampleVn,
        w.cefrEstimate,
        w.synonyms.join(";"),
        w.collocations.join(";"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collectionName.trim() || "vocabulary-collection"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/vocabulary" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Vocabulary
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Custom Vocabulary Builder</h1>
        <p className="text-sm text-slate-600 mt-1">
          Import English words in bulk. Enrich them with IPA pronunciation, parts of speech, definitions, example sentences, and Vietnamese translations.
        </p>
      </div>

      {/* Input panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Paste Words or Phrases
            </label>
            <textarea
              className="w-full h-44 border border-slate-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder={`hello\nhi\ndog\ncat\niguana\nsomething\nlook forward to`}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>One word per line or comma-separated.</span>
              <span>
                <strong>{parsedWords.length}</strong> unique words
              </span>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='e.g. "Work Essentials", "Animals"'
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target CEFR Level
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value)}
            >
              {CEFR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === "auto" ? "Auto-detect" : lvl}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || parsedWords.length === 0}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <span>Enriching Words...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enrich {parsedWords.length} Words</span>
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              Collection Saved Successfully!
            </h3>
            <p className="text-xs text-emerald-700">
              All words have been saved and added to your Spaced Repetition study queue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vocabulary/flashcards"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Review in Flashcards</span>
            </Link>
            <Link
              href="/vocabulary/custom-test"
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Test This List</span>
            </Link>
          </div>
        </div>
      )}

      {/* Enriched Results */}
      {enriched.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Generated Vocabulary ({enriched.length} words)
              </h2>
              <p className="text-xs text-slate-500">
                Review definitions, make inline edits, or export to CSV.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Collection"}</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {enriched.map((item, idx) => {
              const isEditing = editingIdx === idx;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:border-slate-300"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            Word
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                            value={editBuffer.word ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, word: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            IPA
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            value={editBuffer.ipa ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, ipa: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            Part of Speech
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                            value={editBuffer.pos ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, pos: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            CEFR Level
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                            value={editBuffer.cefrEstimate ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, cefrEstimate: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            English Definition
                          </label>
                          <textarea
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs h-16"
                            value={editBuffer.defEn ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, defEn: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            Vietnamese Meaning
                          </label>
                          <textarea
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs h-16"
                            value={editBuffer.defVn ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, defVn: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            Example (EN)
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                            value={editBuffer.exampleEn ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, exampleEn: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-slate-500">
                            Example (VN)
                          </label>
                          <input
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                            value={editBuffer.exampleVn ?? ""}
                            onChange={(e) =>
                              setEditBuffer((b) => ({ ...b, exampleVn: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => saveEdit(idx)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={() => setEditingIdx(null)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-900">
                            {item.word}
                          </span>
                          {item.ipa && (
                            <span className="text-xs text-slate-500 font-mono">
                              {item.ipa}
                            </span>
                          )}
                          <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.pos}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {item.cefrEstimate}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(idx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemove(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-xs space-y-1">
                        <p className="text-slate-800 font-medium">{item.defEn}</p>
                        <p className="text-blue-700">{item.defVn}</p>
                        {item.exampleEn && (
                          <p className="text-slate-500 italic mt-1.5">
                            "{item.exampleEn}"
                          </p>
                        )}
                        {item.exampleVn && (
                          <p className="text-slate-400 text-[11px]">
                            {item.exampleVn}
                          </p>
                        )}
                      </div>

                      {(item.synonyms?.length > 0 || item.collocations?.length > 0) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          {item.synonyms?.length > 0 && (
                            <span>
                              <strong>Synonyms:</strong> {item.synonyms.join(", ")}
                            </span>
                          )}
                          {item.collocations?.length > 0 && (
                            <span>
                              <strong>Collocations:</strong>{" "}
                              {item.collocations.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
