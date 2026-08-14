'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Image as ImageIcon, Mic, HelpCircle, Award, RefreshCw, ChevronRight, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import FormattedMarkdown from './FormattedMarkdown';
import { VISUAL_STORYTELLING_10_MCQS, VideoMCQQuestion } from '@/lib/transcripts/visual-storytelling';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant' | 'quiz' | 'report';
  content?: string;
  quizData?: {
    questions: VideoMCQQuestion[];
    currentIndex: number;
    userAnswers: Record<string, number>;
    isSubmitted: boolean;
  };
  reportData?: {
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
  };
}

interface UnifiedAgentPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'chat' | 'quiz';
  initialPrompt?: string;
  isEmbedded?: boolean;
}

export default function UnifiedAgentPanel({
  isOpen,
  onClose,
  initialMode = 'chat',
  initialPrompt,
  isEmbedded = false,
}: UnifiedAgentPanelProps) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // 4 suggested question cards in a 2-row x 2-col grid
  const samplePrompts = [
    'Rule of Thirds grid',
    '400mm lens compression',
    'Cowboy vs Choker shot',
    '85mm portrait range'
  ];

  // Internal-only scroll to bottom (prevents page from scrolling down to footer)
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Trigger initial mode or prompt when panel opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialMode === 'quiz' && !messages.some(m => m.role === 'quiz' || m.role === 'report')) {
      startQuizInChat();
    } else if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialMode, initialPrompt]);

  if (!isOpen) return null;

  const startQuizInChat = () => {
    // Clear any previous quiz/report cards to prevent duplicate reports
    const cleaned = messages.filter(m => m.role !== 'quiz' && m.role !== 'report');
    const quizMsg: ChatItem = {
      id: `quiz-${Date.now()}`,
      role: 'quiz',
      quizData: {
        questions: VISUAL_STORYTELLING_10_MCQS,
        currentIndex: 0,
        userAnswers: {},
        isSubmitted: false,
      }
    };
    setMessages([...cleaned, quizMsg]);
  };

  const handleSelectQuizOption = (msgId: string, optIdx: number) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== msgId || !msg.quizData) return msg;

        const { questions, currentIndex, userAnswers } = msg.quizData;
        const currentQ = questions[currentIndex];
        const updatedAnswers = { ...userAnswers, [currentQ.id]: optIdx };

        // Next question or submit quiz
        if (currentIndex < questions.length - 1) {
          return {
            ...msg,
            quizData: {
              ...msg.quizData,
              currentIndex: currentIndex + 1,
              userAnswers: updatedAnswers,
            }
          };
        } else {
          // Submit quiz answers to server to fetch AI report directly inside chat stream
          fetchDiagnosticReport(updatedAnswers, msgId);
          return {
            ...msg,
            quizData: {
              ...msg.quizData,
              userAnswers: updatedAnswers,
              isSubmitted: true,
            }
          };
        }
      })
    );
  };

  const fetchDiagnosticReport = async (userAnswers: Record<string, number>, targetQuizMsgId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const reportMsg: ChatItem = {
          id: `report-${Date.now()}`,
          role: 'report',
          reportData: {
            score: data.score,
            total: data.total,
            scorePercentage: data.scorePercentage,
            aiFeedback: data.aiFeedback,
            itemAnalysis: data.itemAnalysis || []
          }
        };

        // Replace the quiz card with single clean report card
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== targetQuizMsgId && m.role !== 'report');
          return [...filtered, reportMsg];
        });
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content || '' }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, conversationHistory: history })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const assistantMsg: ChatItem = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `I'm having trouble processing that right now. Try asking again!`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Network connection issue. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isEmbedded
    ? 'w-full h-full min-h-0 bg-[#121212] flex flex-col overflow-hidden font-sans border-l border-white/10 shadow-2xl'
    : 'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#121212] border-l border-white/10 shadow-2xl flex flex-col font-sans';

  return (
    <div className={containerClass}>
      {/* Panel Header */}
      <div className="bg-[#141414] px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/IMG_2796.PNG" alt="AI Agent Icon" className="w-7 h-7 object-contain" />
          <h2 className="text-base font-extrabold text-white tracking-wide">Assistant</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            CREATIVE LAB AI AGENT
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition flex items-center justify-center border border-white/10"
              title="Close Chat & Return to Curriculum"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          )}
        </div>
      </div>

      {/* Main Feed Container (Internal Scroll Only with Visible Scrollbar) */}
      <div
        ref={chatFeedRef}
        className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5 bg-[#121212] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#141414] [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-400/50"
      >
        {/* Empty State / Initial Landing View */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-3 px-2">
            {/* Header Text above image */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
                CREATIVE LAB AI AGENT
              </h3>
              <p className="text-xs sm:text-sm text-amber-400 font-bold tracking-wide">
                Learn with our AI Agent
              </p>
            </div>

            {/* Custom Center Image */}
            <div className="relative my-2">
              <img
                src="/IMG_2796.PNG"
                alt="Creative Lab AI Agent Robot Cameraman"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto drop-shadow-2xl hover:scale-105 transition-transform"
              />
            </div>

            {/* Suggested Question Cards (2 in a row) */}
            <div className="w-full space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="bg-[#1C1C1C] hover:bg-[#282828] border border-white/12 hover:border-emerald-500/50 rounded-xl p-3 text-xs text-slate-200 font-semibold text-center transition-all duration-200 hover:scale-[1.02] shadow-sm flex items-center justify-center min-h-[48px]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Full-width Assessment Button */}
              <button
                onClick={startQuizInChat}
                className="w-full bg-[#1C1C1C] hover:bg-[#282828] border border-white/12 hover:border-amber-400/50 text-white font-extrabold rounded-xl py-3.5 px-4 text-xs text-center transition-all duration-200 hover:scale-[1.01] shadow-md flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Take 10-Question Video Assessment</span>
              </button>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {/* User Message */}
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#1F1F1F] text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed border border-white/10 shadow-md font-medium">
                  {msg.content}
                </div>
              </div>
            )}

            {/* Assistant Response */}
            {msg.role === 'assistant' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1F1F1F] border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                  <img src="/IMG_2796.PNG" alt="AI Agent" className="w-6 h-6 object-contain" />
                </div>

                <div className="flex-1 bg-[#1A1A1A] p-4 rounded-2xl rounded-tl-none border border-white/10 shadow-md">
                  <FormattedMarkdown content={msg.content || ''} />
                </div>
              </div>
            )}

            {/* Interactive MCQ Quiz Card */}
            {msg.role === 'quiz' && msg.quizData && (
              <div className="bg-[#1A1A1A] border border-amber-500/40 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Question {msg.quizData.currentIndex + 1} of {msg.quizData.questions.length}
                  </span>
                  <span className="text-[10px] bg-black/50 px-2.5 py-1 rounded-md text-slate-300 font-mono border border-white/10">
                    Timestamp: {msg.quizData.questions[msg.quizData.currentIndex].timestamp}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                  {msg.quizData.questions[msg.quizData.currentIndex].question}
                </h4>

                <div className="space-y-2">
                  {msg.quizData.questions[msg.quizData.currentIndex].options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectQuizOption(msg.id, optIdx)}
                      className="w-full text-left p-3 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] border border-white/10 hover:border-amber-400/50 text-xs text-slate-200 font-semibold transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 pr-2">
                        <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold flex items-center justify-center text-slate-300 group-hover:bg-amber-400 group-hover:text-black transition">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Student Diagnostic Report Card */}
            {msg.role === 'report' && msg.reportData && (
              <div className="bg-[#1A1A1A] border border-emerald-500/40 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <Award className="w-6 h-6 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Student Diagnostic Report</h4>
                    <p className="text-xs text-slate-400">Score: {msg.reportData.score} / {msg.reportData.total} ({msg.reportData.scorePercentage}%)</p>
                  </div>
                </div>

                {/* AI Summary Feedback */}
                <div className="bg-[#121212] p-4 rounded-xl border border-white/10">
                  <FormattedMarkdown content={msg.reportData.aiFeedback} />
                </div>

                {/* Full Question Breakdown & Explanations */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Question-by-Question Detailed Breakdown</span>
                  </h5>

                  <div className="space-y-3">
                    {msg.reportData.itemAnalysis.map((item, idx) => (
                      <div
                        key={item.questionId || idx}
                        className={`p-3.5 rounded-xl border space-y-2 text-xs transition ${
                          item.isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-red-950/20 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 font-bold text-white">
                            {item.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <span>{idx + 1}. {item.question}</span>
                          </div>
                          <span className="text-[10px] bg-black/50 px-2 py-0.5 rounded text-slate-400 font-mono shrink-0">
                            {item.timestamp}
                          </span>
                        </div>

                        <div className="pl-5 space-y-1 text-slate-300 text-[11px]">
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
                          <p className="text-slate-300 italic pt-1.5 border-t border-white/5 leading-relaxed">
                            💡 <span className="font-semibold text-slate-200">Explanation:</span> {item.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startQuizInChat}
                  className="w-full bg-[#242424] hover:bg-[#2E2E2E] border border-white/10 text-white font-semibold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake Assessment</span>
                </button>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Typing Loader */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1F1F1F] border border-white/10 flex items-center justify-center text-white shrink-0">
              <img src="/IMG_2796.PNG" alt="AI Agent" className="w-6 h-6 object-contain animate-bounce" />
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-[#141414] border-t border-white/10 shrink-0"
      >
        <div className="bg-[#1C1C1C] border border-white/15 rounded-full px-4 py-2.5 flex items-center gap-3 focus-within:border-white/30 transition shadow-inner">
          <ImageIcon className="w-4 h-4 text-slate-400 hover:text-white transition cursor-pointer shrink-0" />

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask CREATIVE LAB AI or use voice..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none min-w-0 font-medium"
          />

          <Mic className="w-4 h-4 text-slate-400 hover:text-white transition cursor-pointer shrink-0" />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="w-8 h-8 rounded-full bg-white text-black hover:bg-slate-200 transition disabled:opacity-40 flex items-center justify-center shrink-0 font-bold"
          >
            <Send className="w-4 h-4 transform -rotate-45" />
          </button>
        </div>
      </form>
    </div>
  );
}
