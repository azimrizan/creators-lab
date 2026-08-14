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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-amber-500/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 border-b border-white/10 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black shadow-xl ${
              isHighScorer
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20'
                : 'bg-red-500/20 border-red-400 text-red-300 shadow-red-500/20'
            }`}>
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Student Performance Report</span>
              <h2 className="text-xl font-bold text-white leading-tight">Visual Storytelling Diagnostic Analysis</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluated by Gemini AI Agent Engine ({report.modelUsed || 'gemini-2.5-flash'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
          {/* Score Overview Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0B0B0B] p-4 rounded-xl border border-white/10">
            <div className="flex flex-col items-center justify-center p-3 bg-[#171717] rounded-lg border border-white/5">
              <span className="text-xs text-slate-400 font-semibold">Total Score</span>
              <span className="text-2xl font-black text-amber-400 mt-1">{report.score} / {report.total}</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-[#171717] rounded-lg border border-white/5">
              <span className="text-xs text-slate-400 font-semibold">Mastery Percentage</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">{report.scorePercentage}%</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-[#171717] rounded-lg border border-white/5">
              <span className="text-xs text-slate-400 font-semibold">Status Grade</span>
              <span className="text-xs font-extrabold text-amber-300 mt-2 px-2.5 py-1 bg-amber-500/20 rounded-full border border-amber-500/30 text-center">
                {report.scorePercentage >= 80 ? 'Master Storyteller' : report.scorePercentage >= 50 ? 'Intermediate Filmmaker' : 'Apprentice Storyteller'}
              </span>
            </div>
          </div>

          {/* AI Diagnostic Summary Card */}
          <div className="bg-gradient-to-br from-[#1C1C1C] to-[#121212] p-5 rounded-xl border border-amber-500/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Bot className="w-5 h-5" />
              <span>AI Agent Diagnostic Insights</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            
            <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-black/40 p-4 rounded-lg border border-white/5">
              {report.aiFeedback}
            </div>
          </div>

          {/* Item-by-Item Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Question Breakdown & Explanations</span>
            </h4>

            <div className="space-y-3">
              {report.itemAnalysis.map((item, idx) => (
                <div
                  key={item.questionId}
                  className={`p-4 rounded-xl border space-y-2 text-xs transition ${
                    item.isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span className="font-bold text-white">{idx + 1}. {item.question}</span>
                    </div>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="pl-6 space-y-1 text-slate-300">
                    <p>
                      <span className="text-slate-400">Your choice:</span>{' '}
                      <span className={item.isCorrect ? 'text-emerald-300 font-semibold' : 'text-red-300 font-semibold line-through'}>
                        {item.chosenOptionText}
                      </span>
                    </p>
                    {!item.isCorrect && (
                      <p>
                        <span className="text-slate-400">Correct answer:</span>{' '}
                        <span className="text-emerald-400 font-semibold">{item.correctOptionText}</span>
                      </p>
                    )}
                    <p className="text-slate-400 italic pt-1 border-t border-white/5">
                      💡 {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#0B0B0B] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onRetakeQuiz}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition flex items-center gap-2"
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
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
