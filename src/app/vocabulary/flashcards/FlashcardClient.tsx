"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AudioButton } from "@/components/AudioButton";
import {
  ArrowLeft,
  RotateCw,
  CheckCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface FlashcardItem {
  userVocabId: string;
  word: string;
  phonetic?: string | null;
  pos: string;
  defEn: string;
  defVn: string;
  exampleEn: string;
  exampleVn: string;
  cefrLevel: string;
  collocations?: string | null;
  synonyms?: string | null;
  status: string;
  intervalDays: number;
  repetitions: number;
}

export function FlashcardClient({
  cards,
  allCount,
}: {
  cards: FlashcardItem[];
  allCount: number;
}) {
  const [deck, setDeck] = useState<FlashcardItem[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const currentCard = deck[currentIndex];

  const handleRating = async (rating: number) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    try {
      await fetch("/api/vocabulary/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userVocabId: currentCard.userVocabId,
          rating,
        }),
      });

      setReviewedCount((prev) => prev + 1);
      setIsFlipped(false);

      if (rating < 3) {
        // If "Again", push card to the end of the current session deck to re-test!
        setDeck((prev) => [...prev, currentCard]);
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isFinished = currentIndex >= deck.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/vocabulary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vocabulary</span>
        </Link>

        {!isFinished && (
          <div className="text-xs font-semibold text-slate-500">
            Card {currentIndex + 1} of {deck.length}
          </div>
        )}
      </div>

      {isFinished ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm space-y-4">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Session Completed!</h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            You reviewed <strong>{reviewedCount}</strong> vocabulary cards. Your SM-2 review
            intervals have been recalculated and scheduled.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/vocabulary"
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
            >
              Vocabulary Bank
            </Link>
            <Link
              href="/vocabulary/test"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
            >
              Take Vocab Quiz
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-300"
              style={{
                width: `${Math.round((currentIndex / deck.length) * 100)}%`,
              }}
            />
          </div>

          {/* Flashcard Component */}
          <div
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`min-h-[340px] bg-white border-2 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between cursor-pointer transition ${
              isFlipped ? "border-blue-300" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {currentCard.cefrLevel}
              </span>
              <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                {currentCard.pos}
              </span>
            </div>

            {/* Card Front (English Word) */}
            <div className="text-center py-6 space-y-3">
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {currentCard.word}
                </h1>
                <AudioButton text={currentCard.word} />
              </div>

              {currentCard.phonetic && (
                <p className="text-sm text-slate-500 font-mono">{currentCard.phonetic}</p>
              )}

              {currentCard.exampleEn && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 italic max-w-md mx-auto">
                  “{currentCard.exampleEn}”
                </div>
              )}
            </div>

            {/* Card Back (Flipped details) */}
            {isFlipped ? (
              <div className="pt-4 border-t border-slate-200 text-center space-y-2 animate-fadeIn">
                <div className="text-lg font-bold text-blue-700">{currentCard.defVn}</div>
                <div className="text-xs text-slate-600">{currentCard.defEn}</div>

                {currentCard.exampleVn && (
                  <div className="text-xs text-slate-500 italic">
                    Dịch: {currentCard.exampleVn}
                  </div>
                )}

                {currentCard.collocations && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    <strong className="text-slate-700">Collocations:</strong>{" "}
                    {currentCard.collocations}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 font-medium">
                Click card or press flip to reveal Vietnamese meaning
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isFlipped ? (
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Show Vietnamese Meaning</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-center text-xs font-semibold text-slate-500 mb-1">
                How easily did you recall this word? (SM-2 Spaced Repetition)
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRating(1)}
                  className="py-2.5 px-1 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition text-center"
                >
                  <span className="block text-sm">Again</span>
                  <span className="text-[10px] text-rose-600 font-normal">&lt; 1 day</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRating(3)}
                  className="py-2.5 px-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 transition text-center"
                >
                  <span className="block text-sm">Hard</span>
                  <span className="text-[10px] text-amber-600 font-normal">1 day</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRating(4)}
                  className="py-2.5 px-1 bg-blue-50 border border-blue-300 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-100 transition text-center"
                >
                  <span className="block text-sm">Good</span>
                  <span className="text-[10px] text-blue-600 font-normal">Standard</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRating(5)}
                  className="py-2.5 px-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition text-center"
                >
                  <span className="block text-sm">Easy</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Max interval</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
