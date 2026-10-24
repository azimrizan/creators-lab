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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-[#d33028]/30 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col text-zinc-900">
        {/* Header */}
        <div className="bg-zinc-50 p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d33028]/10 border border-[#d33028]/30 flex items-center justify-center text-[#d33028]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 tracking-wide">AI Agent Knowledge Check</h3>
                <span className="bg-[#d33028]/10 text-[#d33028] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-[#d33028]/30">
                  10 MCQs
                </span>
              </div>
              <p className="text-xs text-zinc-500">Introduction to Visual Storytelling Assessment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-1.5 relative">
          <div
            className="bg-[#d33028] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quiz Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Question Index Badge */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-[#d33028] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[11px] bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200 font-mono text-zinc-600">
              Timestamp: {currentQuestion.timestamp}
            </span>
          </div>

          {/* Question Title */}
          <h4 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
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
                      ? 'bg-[#d33028]/10 border-[#d33028] text-zinc-900 shadow-md scale-[1.01]'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#d33028] text-white border-[#d33028]'
                        : 'bg-white text-zinc-600 border-zinc-300'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#d33028] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Sparkles className="w-4 h-4 text-[#d33028]" />
            Select an answer to automatically move forward
          </span>
          <span className="font-mono text-[#d33028] font-semibold">{progressPercent}% Done</span>
        </div>
      </div>
    </div>
  );
}
