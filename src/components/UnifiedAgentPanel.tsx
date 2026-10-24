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
      console.error('Failed to generate diagnostic report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content || '' }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory,
        })
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
        const errorMsg: ChatItem = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: data.error || 'I encountered an error connecting to the creative knowledge base. Please try again.',
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: ChatItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Network connection issue. Please check your connection and retry.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isEmbedded
    ? 'flex flex-col h-full bg-white text-zinc-900 overflow-hidden select-none font-sans'
    : 'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-zinc-200 shadow-2xl flex flex-col font-sans';

  return (
    <div className={containerClass}>
      {/* Panel Header */}
      <div className="bg-white px-5 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/IMG_2796.PNG" alt="AI Agent Icon" className="w-7 h-7 object-contain" />
          <h2 className="text-base font-extrabold text-zinc-900 tracking-wide">Assistant</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-wider text-[#d33028] uppercase">
            CREATIVE LAB AI AGENT
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition flex items-center justify-center border border-zinc-200"
              title="Close Chat & Return to Curriculum"
            >
              <X className="w-5 h-5 text-zinc-600" />
            </button>
          )}
        </div>
      </div>

      {/* Main Feed Container (Internal Scroll Only with Visible Scrollbar) */}
      <div
        ref={chatFeedRef}
        className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5 bg-zinc-50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-100 [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#d33028]/50"
      >
        {/* Empty State / Initial Landing View */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-3 px-2">
            {/* Header Text above image */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-wider uppercase">
                CREATIVE LAB AI AGENT
              </h3>
              <p className="text-xs sm:text-sm text-[#d33028] font-bold tracking-wide">
                Learn with our AI Agent
              </p>
            </div>

            {/* Custom Center Image */}
            <div className="relative my-2">
              <img
                src="/IMG_2796.PNG"
                alt="Creative Lab AI Agent Robot Cameraman"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>

            {/* Suggested Question Cards (2 in a row) */}
            <div className="w-full space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-[#d33028] rounded-xl p-3 text-xs text-zinc-800 font-semibold text-center transition-all duration-200 hover:scale-[1.02] shadow-sm flex items-center justify-center min-h-[48px]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Full-width Assessment Button */}
              <button
                onClick={startQuizInChat}
                className="w-full bg-white hover:bg-zinc-100 border border-zinc-200 hover:border-[#d33028] text-zinc-900 font-extrabold rounded-xl py-3.5 px-4 text-xs text-center transition-all duration-200 hover:scale-[1.01] shadow-sm flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-[#d33028]" />
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
                <div className="max-w-[85%] bg-[#d33028] text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-sm font-medium">
                  {msg.content}
                </div>
              </div>
            )}

            {/* Assistant Response */}
            {msg.role === 'assistant' && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0 mt-0.5 shadow-sm">
                  <img src="/IMG_2796.PNG" alt="AI Agent" className="w-6 h-6 object-contain" />
                </div>

                <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none border border-zinc-200 shadow-sm text-zinc-900">
                  <FormattedMarkdown content={msg.content || ''} />
                </div>
              </div>
            )}

            {/* Interactive MCQ Quiz Card */}
            {msg.role === 'quiz' && msg.quizData && (
              <div className="bg-white border border-[#d33028]/40 p-4 sm:p-5 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <span className="text-xs font-bold text-[#d33028] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Question {msg.quizData.currentIndex + 1} of {msg.quizData.questions.length}
                  </span>
                  <span className="text-[10px] bg-zinc-100 px-2.5 py-1 rounded-md text-zinc-600 font-mono border border-zinc-200">
                    Timestamp: {msg.quizData.questions[msg.quizData.currentIndex].timestamp}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 leading-snug">
                  {msg.quizData.questions[msg.quizData.currentIndex].question}
                </h4>

                <div className="space-y-2">
                  {msg.quizData.questions[msg.quizData.currentIndex].options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectQuizOption(msg.id, optIdx)}
                      className="w-full text-left p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-[#d33028] text-xs text-zinc-800 font-semibold transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 pr-2">
                        <span className="w-5 h-5 rounded-md bg-white border border-zinc-200 text-[10px] font-bold flex items-center justify-center text-zinc-700 group-hover:bg-[#d33028] group-hover:text-white transition">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#d33028] transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Student Diagnostic Report Card */}
            {msg.role === 'report' && msg.reportData && (
              <div className="bg-white border border-emerald-500/40 p-4 sm:p-5 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center gap-3 border-b border-zinc-200 pb-3">
                  <Award className="w-6 h-6 text-amber-500" />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Student Diagnostic Report</h4>
                    <p className="text-xs text-zinc-500">Score: {msg.reportData.score} / {msg.reportData.total} ({msg.reportData.scorePercentage}%)</p>
                  </div>
                </div>

                {/* AI Summary Feedback */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-zinc-800">
                  <FormattedMarkdown content={msg.reportData.aiFeedback} />
                </div>

                {/* Full Question Breakdown & Explanations */}
                <div className="space-y-3 pt-2 border-t border-zinc-200">
                  <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>Question-by-Question Detailed Breakdown</span>
                  </h5>

                  <div className="space-y-3">
                    {msg.reportData.itemAnalysis.map((item, idx) => (
                      <div
                        key={item.questionId || idx}
                        className={`p-3.5 rounded-xl border space-y-2 text-xs transition ${
                          item.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-zinc-900'
                            : 'bg-rose-50 border-rose-200 text-zinc-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 font-bold text-zinc-900">
                            {item.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <span>{idx + 1}. {item.question}</span>
                          </div>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded text-zinc-600 font-mono shrink-0 border border-zinc-200">
                            {item.timestamp}
                          </span>
                        </div>

                        <div className="pl-5 space-y-1 text-zinc-700 text-[11px]">
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
                          <p className="text-zinc-700 italic pt-1.5 border-t border-zinc-200 leading-relaxed">
                            💡 <span className="font-semibold text-zinc-900">Explanation:</span> {item.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startQuizInChat}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 font-semibold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
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
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
              <img src="/IMG_2796.PNG" alt="AI Agent" className="w-6 h-6 object-contain animate-bounce" />
            </div>
            <div className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
        className="p-4 bg-white border-t border-zinc-200 shrink-0"
      >
        <div className="bg-zinc-50 border border-zinc-300 rounded-full px-4 py-2.5 flex items-center gap-3 focus-within:border-[#d33028] transition shadow-inner">
          <ImageIcon className="w-4 h-4 text-zinc-400 hover:text-zinc-700 transition cursor-pointer shrink-0" />

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask CREATIVE LAB AI or use voice..."
            className="flex-1 bg-transparent text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none min-w-0 font-medium"
          />

          <Mic className="w-4 h-4 text-zinc-400 hover:text-zinc-700 transition cursor-pointer shrink-0" />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#d33028] text-white hover:bg-[#b82720] transition disabled:opacity-40 flex items-center justify-center shrink-0 font-bold"
          >
            <Send className="w-4 h-4 transform -rotate-45" />
          </button>
        </div>
      </form>
    </div>
  );
}
