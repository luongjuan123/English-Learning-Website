"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AudioButton } from "@/components/AudioButton";
import {
  Search,
  Plus,
  Layers,
  GraduationCap,
  Volume2,
  Filter,
  CheckCircle2,
  X,
  BookOpen,
} from "lucide-react";

export interface VocabItem {
  id: string; // userVocabularyId
  wordId: string;
  word: string;
  phonetic?: string | null;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
  cefrLevel: string;
  topic: string;
  synonyms?: string | null;
  collocations?: string | null;
  status: string; // 'new' | 'learning' | 'familiar' | 'mastered'
  repetitions: number;
  intervalDays: number;
  nextReviewDate: string;
}

export function VocabularyClient({ initialWords }: { initialWords: VocabItem[] }) {
  const [words, setWords] = useState<VocabItem[]>(initialWords);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  // Add word modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState({
    word: "",
    phonetic: "",
    pos: "noun",
    defEn: "",
    defVn: "",
    exampleEn: "",
    exampleVn: "",
    cefrLevel: "A1",
    topic: "General",
    synonyms: "",
    collocations: "",
  });
  const [adding, setAdding] = useState(false);

  // Status update
  const handleStatusChange = async (userVocabId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/vocabulary/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userVocabId, status: newStatus }),
      });
      if (res.ok) {
        setWords((prev) =>
          prev.map((w) => (w.id === userVocabId ? { ...w, status: newStatus } : w))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Add word submission
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word.trim() || !newWord.defVn.trim()) {
      alert("Please enter word and Vietnamese meaning.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/vocabulary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWord),
      });

      const data = await res.json();
      if (res.ok) {
        const item: VocabItem = {
          id: data.userVocab.id,
          wordId: data.word.id,
          word: data.word.word,
          phonetic: data.word.phonetic,
          pos: data.word.pos,
          defEn: data.word.defEn,
          defVn: data.word.defVn,
          exampleEn: data.word.exampleEn,
          exampleVn: data.word.exampleVn,
          cefrLevel: data.word.cefrLevel,
          topic: data.word.topic,
          synonyms: data.word.synonyms,
          collocations: data.word.collocations,
          status: "new",
          repetitions: 0,
          intervalDays: 0,
          nextReviewDate: new Date().toISOString(),
        };
        setWords((prev) => [item, ...prev]);
        setShowAddModal(false);
        setNewWord({
          word: "",
          phonetic: "",
          pos: "noun",
          defEn: "",
          defVn: "",
          exampleEn: "",
          exampleVn: "",
          cefrLevel: "A1",
          topic: "General",
          synonyms: "",
          collocations: "",
        });
      } else {
        alert(data.error || "Failed to add word");
      }
    } catch (err: any) {
      alert(err.message || "Error adding word");
    } finally {
      setAdding(false);
    }
  };

  // Filter words
  const filteredWords = words.filter((w) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      w.word.toLowerCase().includes(q) ||
      w.defVn.toLowerCase().includes(q) ||
      w.defEn.toLowerCase().includes(q) ||
      w.topic.toLowerCase().includes(q);

    const matchesLevel = levelFilter === "all" || w.cefrLevel === levelFilter;
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesTopic = topicFilter === "all" || w.topic === topicFilter;

    return matchesSearch && matchesLevel && matchesStatus && matchesTopic;
  });

  // Unique topics
  const topics = Array.from(new Set(words.map((w) => w.topic))).filter(Boolean);

  // Status badges mapping
  const statusStyles: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    learning: "bg-amber-100 text-amber-800 border-amber-200",
    familiar: "bg-indigo-100 text-indigo-800 border-indigo-200",
    mastered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="space-y-6">
      {/* Top action strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Vocabulary Bank
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Store, categorize, and master English words with spaced repetition and pronunciation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/vocabulary/flashcards"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Spaced Review</span>
          </Link>

          <Link
            href="/vocabulary/test"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Vocab Test</span>
          </Link>

          <Link
            href="/vocabulary/custom-test"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
          >
            <BookOpen className="w-4 h-4" />
            <span>Custom Test</span>
          </Link>

          <Link
            href="/vocabulary/custom-vocab"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Vocab</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Word</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search word, meaning in Vietnamese, definition, topic..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Levels</option>
            <option value="A1">A1 Level</option>
            <option value="A2">A2 Level</option>
            <option value="B1">B1 Level</option>
            <option value="B2">B2 Level</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="learning">Learning</option>
            <option value="familiar">Familiar</option>
            <option value="mastered">Mastered</option>
          </select>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing {filteredWords.length} words</span>
          <span>Total Bank: {words.length} terms</span>
        </div>
      </div>

      {/* Words Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWords.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{item.word}</span>
                  {item.phonetic && (
                    <span className="text-xs text-slate-500 font-mono">{item.phonetic}</span>
                  )}
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {item.pos}
                  </span>
                  <AudioButton text={item.word} />
                </div>
                <div className="text-xs font-bold text-blue-700 mt-1">{item.defVn}</div>
                <div className="text-xs text-slate-600 mt-0.5">{item.defEn}</div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {item.cefrLevel}
                </span>

                {/* Status Dropdown */}
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`text-[10px] font-bold border rounded px-1.5 py-0.5 cursor-pointer ${
                    statusStyles[item.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="familiar">Familiar</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>
            </div>

            {/* Example sentence */}
            {item.exampleEn && (
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                <p className="text-slate-800 italic">“{item.exampleEn}”</p>
                {item.exampleVn && (
                  <p className="text-slate-500 text-[11px] mt-0.5">{item.exampleVn}</p>
                )}
              </div>
            )}

            {/* Collocations & Synonyms */}
            {(item.collocations || item.synonyms) && (
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-slate-100">
                {item.collocations && (
                  <div>
                    <span className="font-semibold text-slate-700">Collocations: </span>
                    <span>{item.collocations}</span>
                  </div>
                )}
                {item.synonyms && (
                  <div>
                    <span className="font-semibold text-slate-700">Synonyms: </span>
                    <span>{item.synonyms}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No words match your filters</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or reset the filters.
          </p>
        </div>
      )}

      {/* Add New Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Vocabulary Word</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    English Word *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    placeholder="e.g. resilient"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phonetic IPA
                  </label>
                  <input
                    type="text"
                    value={newWord.phonetic}
                    onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                    placeholder="e.g. /rɪˈzɪliənt/"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Part of Speech
                  </label>
                  <select
                    value={newWord.pos}
                    onChange={(e) => setNewWord({ ...newWord, pos: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="noun">noun</option>
                    <option value="verb">verb</option>
                    <option value="adjective">adjective</option>
                    <option value="adverb">adverb</option>
                    <option value="phrase">phrase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEFR Level
                  </label>
                  <select
                    value={newWord.cefrLevel}
                    onChange={(e) => setNewWord({ ...newWord, cefrLevel: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={newWord.topic}
                    onChange={(e) => setNewWord({ ...newWord, topic: e.target.value })}
                    placeholder="e.g. Business"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vietnamese Meaning *
                </label>
                <input
                  type="text"
                  required
                  value={newWord.defVn}
                  onChange={(e) => setNewWord({ ...newWord, defVn: e.target.value })}
                  placeholder="e.g. kiên cường, mau hồi phục"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  English Definition
                </label>
                <input
                  type="text"
                  value={newWord.defEn}
                  onChange={(e) => setNewWord({ ...newWord, defEn: e.target.value })}
                  placeholder="e.g. able to recoil or spring back into shape after bending"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Example Sentence (English)
                </label>
                <input
                  type="text"
                  value={newWord.exampleEn}
                  onChange={(e) => setNewWord({ ...newWord, exampleEn: e.target.value })}
                  placeholder="e.g. She remained resilient despite repeated setbacks."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Example Translation (Vietnamese)
                </label>
                <input
                  type="text"
                  value={newWord.exampleVn}
                  onChange={(e) => setNewWord({ ...newWord, exampleVn: e.target.value })}
                  placeholder="e.g. Cô ấy vẫn kiên cường bất chấp những thất bại lặp đi lặp lại."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Common Collocations
                  </label>
                  <input
                    type="text"
                    value={newWord.collocations}
                    onChange={(e) => setNewWord({ ...newWord, collocations: e.target.value })}
                    placeholder="e.g. highly resilient, build resilience"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Synonyms
                  </label>
                  <input
                    type="text"
                    value={newWord.synonyms}
                    onChange={(e) => setNewWord({ ...newWord, synonyms: e.target.value })}
                    placeholder="e.g. tough, hardy"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? "Saving..." : "Add to Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
