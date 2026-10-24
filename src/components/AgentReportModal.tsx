'use client';

import React from 'react';
import { Award, CheckCircle2, XCircle, Bot, Sparkles, RefreshCw, X, ArrowRight, BookOpen } from 'lucide-react';

interface ReportData {
  score: number;
  total: number;
  scorePercentage: number;
  aiFeedback: string;
  itemAnalysis: Array<{
    questionId: string;
    question: string;
    chosenOptionIndex: number;
    chosenOptionText: string;
    correctOptionIndex: number;
    correctOptionText: string;
    isCorrect: boolean;
    explanation: string;
    timestamp: string;
  }>;
  modelUsed?: string;
}

interface AgentReportModalProps {
  report: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAgentChat: (initialPrompt?: string) => void;
  onRetakeQuiz: () => void;
}

export default function AgentReportModal({
  report,
  isOpen,
  onClose,
  onOpenAgentChat,
  onRetakeQuiz,
}: AgentReportModalProps) {
  if (!isOpen || !report) return null;

  const isHighScorer = report.scorePercentage >= 70;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-[#d33028]/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900">
        {/* Header */}
        <div className="bg-zinc-50 p-6 border-b border-zinc-200 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black shadow-md ${
              isHighScorer
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-rose-50 border-rose-300 text-rose-600'
            }`}>
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#d33028]">Student Performance Report</span>
              <h2 className="text-xl font-bold text-zinc-900 leading-tight">Visual Storytelling Diagnostic Analysis</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Evaluated by Gemini AI Agent Engine ({report.modelUsed || 'gemini-2.5-flash'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
          {/* Score Overview Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
              <span className="text-xs text-zinc-500 font-semibold">Total Score</span>
              <span className="text-2xl font-black text-zinc-900 mt-1">{report.score} / {report.total}</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
              <span className="text-xs text-zinc-500 font-semibold">Mastery Percentage</span>
              <span className="text-2xl font-black text-[#d33028] mt-1">{report.scorePercentage}%</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-zinc-200 shadow-sm">
              <span className="text-xs text-zinc-500 font-semibold">Status Grade</span>
              <span className="text-xs font-extrabold text-[#d33028] mt-2 px-2.5 py-1 bg-[#d33028]/10 rounded-full border border-[#d33028]/30 text-center">
                {report.scorePercentage >= 80 ? 'Master Storyteller' : report.scorePercentage >= 50 ? 'Intermediate Filmmaker' : 'Apprentice Storyteller'}
              </span>
            </div>
          </div>

          {/* AI Diagnostic Summary Card */}
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#d33028] font-bold text-sm">
              <Bot className="w-5 h-5" />
              <span>AI Agent Diagnostic Insights</span>
              <Sparkles className="w-4 h-4 text-[#d33028] animate-pulse" />
            </div>
            
            <div className="text-xs text-zinc-800 whitespace-pre-line leading-relaxed font-sans bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
              {report.aiFeedback}
            </div>
          </div>

          {/* Item-by-Item Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#d33028]" />
              <span>Question Breakdown & Explanations</span>
            </h4>

            <div className="space-y-3">
              {report.itemAnalysis.map((item, idx) => (
                <div
                  key={item.questionId}
                  className={`p-4 rounded-xl border space-y-2 text-xs transition ${
                    item.isCorrect
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className="font-bold text-zinc-900">{idx + 1}. {item.question}</span>
                    </div>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded text-zinc-600 border border-zinc-200 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="pl-6 space-y-1 text-zinc-700">
                    <p>
                      <span className="text-zinc-500">Your choice:</span>{' '}
                      <span className={item.isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold line-through'}>
                        {item.chosenOptionText}
                      </span>
                    </p>
                    {!item.isCorrect && (
                      <p>
                        <span className="text-zinc-500">Correct answer:</span>{' '}
                        <span className="text-emerald-700 font-semibold">{item.correctOptionText}</span>
                      </p>
                    )}
                    <p className="text-zinc-600 italic pt-1 border-t border-zinc-200">
                      💡 {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onRetakeQuiz}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-semibold text-xs transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>

          <button
            onClick={() => {
              onClose();
              const missed = report.itemAnalysis.filter(i => !i.isCorrect).map(i => i.question).join(', ');
              const prompt = missed 
                ? `Hi! I scored ${report.score}/10 on the quiz. Can you clarify the concepts I missed: ${missed}?`
                : `Hi! I scored ${report.score}/10 on the Visual Storytelling quiz. Can you share advanced cinematic framing techniques?`;
              onOpenAgentChat(prompt);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#d33028] hover:bg-[#b82720] text-white font-bold text-xs transition shadow-md flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>Clarify Doubts with AI Agent</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
