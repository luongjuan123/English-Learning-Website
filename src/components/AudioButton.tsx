"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AudioButtonProps {
  text: string;
  rate?: number;
  className?: string;
  label?: string;
}

export function AudioButton({
  text,
  rate = 0.9,
  className = "",
  label,
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      title={`Listen to: "${text}"`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
      aria-label={label || `Play audio for ${text}`}
    >
      {isPlaying ? (
        <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
