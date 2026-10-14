"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AudioButton } from "@/components/AudioButton";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  BookmarkPlus,
  BookmarkCheck,
  Eye,
  EyeOff,
  Volume2,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import { normalizeText, checkAnswer } from "@/lib/grading";

interface ExerciseItem {
  id: string;
  type: string;
  prompt: string;
  promptVn?: string | null;
  optionsJson?: string | null;
  answer: string;
  explanation?: string | null;
  orderIndex: number;
}

interface LessonInteractiveProps {
  lessonId: string;
  initialCompleted: boolean;
  cefrLevel: string;
  readingPassage?: string | null;
  readingPassageVn?: string | null;
  listeningScript?: string | null;
  exercises: ExerciseItem[];
  vocabularyList: Array<{
    word: string;
    phonetic?: string | null;
    pos: string;
    defEn: string;
    defVn: string;
    exampleEn: string;
    exampleVn: string;
  }>;
  nextLessonId?: string | null;
}

export function LessonInteractive({
  lessonId,
  initialCompleted,
  cefrLevel,
  readingPassage,
  readingPassageVn,
  listeningScript,
  exercises,
  vocabularyList,
  nextLessonId,
}: LessonInteractiveProps) {
  // Reading state
  const [showReadingVn, setShowReadingVn] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Listening state
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.9);

  // Vocabulary saved state
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  // Exercise states
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<
    Record<string, { isCorrect: boolean; showExplanation: boolean }>
  >({});

  // Lesson completion state
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [savingProgress, setSavingProgress] = useState(false);

  // Save word to user vocabulary
  const handleSaveWord = async (wordItem: {
    word: string;
    phonetic?: string | null;
    pos: string;
    defEn: string;
    defVn: string;
    exampleEn: string;
    exampleVn: string;
  }) => {
    try {
      const res = await fetch("/api/vocabulary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...wordItem,
          cefrLevel,
        }),
      });
      if (res.ok) {
        setSavedWords((prev) => ({ ...prev, [wordItem.word.toLowerCase()]: true }));
      }
    } catch (err) {
      console.error("Failed to save word:", err);
    }
  };

  // Quick word lookup on reading passage click
  const handleWordClick = (rawWord: string) => {
    const cleaned = rawWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (!cleaned) return;
    setSelectedWord(cleaned);
  };

  // Check single exercise answer
  const handleCheckAnswer = (exercise: ExerciseItem) => {
    const userAnswer = answers[exercise.id] || "";
    const isCorrect = checkAnswer(exercise.type, userAnswer, exercise.answer);
    setFeedback((prev) => ({
      ...prev,
      [exercise.id]: { isCorrect, showExplanation: true },
    }));
  };

  // Mark lesson as complete
  const handleCompleteLesson = async () => {
    setSavingProgress(true);
    try {
      // Calculate exercise score
      let correctCount = 0;
      exercises.forEach((ex) => {
        if (feedback[ex.id]?.isCorrect) {
          correctCount += 1;
        }
      });
      const score = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 100;

      const res = await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          status: "completed",
          quizScore: score,
        }),
      });

      if (res.ok) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Failed to mark lesson complete:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <div className="space-y-10 mt-8">
      {/* 1. Target Vocabulary Section */}
      {vocabularyList && vocabularyList.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Target Vocabulary in this Lesson</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click the speaker to hear pronunciation, or save words to your Spaced Repetition deck.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabularyList.map((item, idx) => {
              const isSaved = savedWords[item.word.toLowerCase()];
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-white hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{item.word}</span>
                        {item.phonetic && (
                          <span className="text-xs text-slate-500 font-mono">{item.phonetic}</span>
                        )}
                        <span className="text-[11px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                          {item.pos}
                        </span>
                        <AudioButton text={item.word} />
                      </div>
                      <div className="text-xs font-semibold text-blue-700 mt-1">
                        {item.defVn}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{item.defEn}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveWord(item)}
                      disabled={isSaved}
                      className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition ${
                        isSaved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                      title={isSaved ? "Saved to Flashcards" : "Add to My Vocabulary"}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-semibold">Saved</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4 text-slate-500" />
                          <span className="text-[11px]">Save</span>
                        </>
                      )}
                    </button>
                  </div>

                  {item.exampleEn && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs">
                      <p className="text-slate-800 italic">“{item.exampleEn}”</p>
                      {item.exampleVn && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{item.exampleVn}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Reading Passage with Clickable Dictionary & Translation */}
      {readingPassage && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Reading Passage</h3>
              <p className="text-xs text-slate-500">
                Click any word to look up its meaning, or toggle Vietnamese translation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AudioButton text={readingPassage} label="Listen to Passage" rate={0.85} />
              <button
                type="button"
                onClick={() => setShowReadingVn(!showReadingVn)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                {showReadingVn ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showReadingVn ? "Hide Translation" : "Show Translation (VN)"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Words Passage */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed">
            {readingPassage.split(" ").map((w, idx) => (
              <span
                key={idx}
                onClick={() => handleWordClick(w)}
                className="cursor-pointer hover:bg-blue-100 hover:text-blue-900 rounded px-0.5 transition"
              >
                {w}{" "}
              </span>
            ))}
          </div>

          {/* Quick dictionary popup if clicked */}
          {selectedWord && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900 text-sm">{selectedWord}</span>
                <AudioButton text={selectedWord} />
                <span className="text-slate-600">
                  (Looking for word in dictionary...)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveWord({
                      word: selectedWord,
                      pos: "word",
                      defEn: `Target vocabulary term: ${selectedWord}`,
                      defVn: `Từ vựng bài đọc: ${selectedWord}`,
                      exampleEn: `Example with ${selectedWord}`,
                      exampleVn: `Ví dụ với ${selectedWord}`,
                    })
                  }
                  className="px-2 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Save Word
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWord(null)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Vietnamese Translation Toggle */}
          {showReadingVn && readingPassageVn && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-slate-800 text-xs leading-relaxed">
              <strong className="block text-amber-900 font-semibold mb-1">
                Bản dịch tiếng Việt tham khảo:
              </strong>
              {readingPassageVn}
            </div>
          )}
        </section>
      )}

      {/* 3. Listening Practice Section */}
      {listeningScript && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-600" />
                <span>Listening Practice</span>
              </h3>
              <p className="text-xs text-slate-500">
                Train your auditory comprehension. Listen first before revealing the transcript.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700"
              >
                <option value={0.75}>0.75x (Slow)</option>
                <option value={0.9}>0.9x (Standard)</option>
                <option value={1.0}>1.0x (Normal)</option>
              </select>

              <AudioButton
                text={listeningScript}
                rate={playbackSpeed}
                label="Play Audio"
                className="bg-indigo-50 text-indigo-700 border-indigo-200"
              />

              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-3 py-1 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </button>
            </div>
          </div>

          {showTranscript && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed">
              {listeningScript}
            </div>
          )}
        </section>
      )}

      {/* 4. Interactive Practice Exercises */}
      {exercises.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-3 mb-6">
            <h3 className="text-lg font-bold text-slate-900">Practice Exercises</h3>
            <p className="text-xs text-slate-500">
              Complete each exercise and check your answer for instant grading and explanation.
            </p>
          </div>

          <div className="space-y-6">
            {exercises.map((ex, idx) => {
              const currentAnswer = answers[ex.id] || "";
              const fb = feedback[ex.id];
              let parsedOptions: string[] = [];
              if (ex.optionsJson) {
                try {
                  parsedOptions = JSON.parse(ex.optionsJson);
                } catch {}
              }

              return (
                <div
                  key={ex.id}
                  className={`border rounded-lg p-5 transition ${
                    fb
                      ? fb.isCorrect
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-rose-300 bg-rose-50/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      Question {idx + 1} ({ex.type.toUpperCase()})
                    </span>
                    {fb && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          fb.isCorrect ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {fb.isCorrect ? (
                          <>
                            <CheckCircle className="w-4 h-4" /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Incorrect
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-1">{ex.prompt}</p>
                  {ex.promptVn && (
                    <p className="text-xs text-slate-500 italic mb-3">{ex.promptVn}</p>
                  )}

                  {/* Input based on type */}
                  <div className="mt-3">
                    {ex.type === "mcq" && parsedOptions.length > 0 ? (
                      <div className="space-y-2">
                        {parsedOptions.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                              currentAnswer === opt
                                ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`exercise-${ex.id}`}
                              value={opt}
                              checked={currentAnswer === opt}
                              onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))
                              }
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentAnswer}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))
                          }
                          placeholder={
                            ex.type === "reorder"
                              ? "Type the words in correct order..."
                              : "Type your answer here..."
                          }
                          className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Check button */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleCheckAnswer(ex)}
                      className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-900 transition"
                    >
                      Check Answer
                    </button>

                    {fb && (
                      <span className="text-xs text-slate-600">
                        Correct Answer: <strong className="text-slate-900">{ex.answer}</strong>
                      </span>
                    )}
                  </div>

                  {/* Explanation */}
                  {fb && ex.explanation && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-700 flex items-start gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{ex.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Complete Lesson Action Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center shadow-sm">
        {isCompleted ? (
          <div className="space-y-3">
            <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Lesson Completed!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your progress has been recorded and added to your daily study streak.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/learn"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Back to Syllabus
              </Link>
              {nextLessonId && (
                <Link
                  href={`/learn/lesson/${nextLessonId}`}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Ready to complete this lesson?</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Make sure you have reviewed the grammar rules, listened to the pronunciation, and completed the practice exercises.
            </p>
            <button
              type="button"
              disabled={savingProgress}
              onClick={handleCompleteLesson}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{savingProgress ? "Saving..." : "Mark Lesson as Completed"}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
