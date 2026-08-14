'use client';

import React, { useState } from 'react';
import { VideoMCQQuestion } from '@/lib/transcripts/visual-storytelling';
import { Bot, CheckCircle2, ChevronRight, Sparkles, X, HelpCircle } from 'lucide-react';

interface AgentQuizModalProps {
  questions: VideoMCQQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onCompleteQuiz: (userAnswers: Record<string, number>) => void;
}

export default function AgentQuizModal({
  questions,
  isOpen,
  onClose,
  onCompleteQuiz,
}: AgentQuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (!isOpen || !questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optIdx: number) => {
    setSelectedOption(optIdx);
    const updatedAnswers = { ...userAnswers, [currentQuestion.id]: optIdx };
    setUserAnswers(updatedAnswers);

    // Short delay for smooth visual click feedback before moving to next question
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
      } else {
        onCompleteQuiz(updatedAnswers);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-amber-500/30 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/80 via-black to-amber-950/80 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">AI Agent Knowledge Check</h3>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  10 MCQs
                </span>
              </div>
              <p className="text-xs text-slate-400">Introduction to Visual Storytelling Assessment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1F1F1F] h-1.5 relative">
          <div
            className="bg-gradient-to-r from-red-500 to-amber-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quiz Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Question Index Badge */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[11px] bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              Timestamp: {currentQuestion.timestamp}
            </span>
          </div>

          {/* Question Title */}
          <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
            {currentQuestion.question}
          </h4>

          {/* Option Cards */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = selectedOption === optIdx || userAnswers[currentQuestion.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10 scale-[1.01]'
                      : 'bg-[#1C1C1C] border-white/10 text-slate-200 hover:bg-[#252525] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-300'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-[#0B0B0B] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Select an answer to automatically move forward
          </span>
          <span className="font-mono text-amber-400 font-semibold">{progressPercent}% Done</span>
        </div>
      </div>
    </div>
  );
}
