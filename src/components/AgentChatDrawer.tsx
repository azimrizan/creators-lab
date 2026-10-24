'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, X, User, RefreshCw, MessageSquare, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp?: string;
  modelUsed?: string;
  relevantTimestamps?: Array<{ timestamp: string; topic: string }>;
}

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export default function AgentChatDrawer({ isOpen, onClose, initialPrompt }: AgentChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'agent',
      content: `Hello! I am your AI Visual Storytelling Co-Pilot trained directly on Philip Bloom's masterclass. Ask me anything about framing, Rule of Thirds, lens choices, focal length compression, or shot types!`,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Explain the Rule of Thirds',
    'What is lens compression at 400mm?',
    'What is a Cowboy Shot vs Choker?',
    'Why use 85mm for portraits?'
  ];

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: data.answer,
          modelUsed: data.modelUsed,
          relevantTimestamps: data.relevantTimestamps,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'agent',
          content: data.error || 'Failed to process your question.',
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: 'Network connection issue. Please verify server status.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl flex flex-col font-sans text-zinc-900 animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#d33028]/10 border border-[#d33028]/30 flex items-center justify-center text-[#d33028]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              <span>Visual Storytelling AI Agent</span>
              <Sparkles className="w-3.5 h-3.5 text-[#d33028]" />
            </h3>
            <p className="text-[11px] text-zinc-500">Powered by Gemini Multi-Model RAG Engine</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Quick Prompts */}
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex gap-2 overflow-x-auto no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 text-[11px] bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded-full border border-zinc-300 transition whitespace-nowrap shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar bg-zinc-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
              msg.role === 'user'
                ? 'bg-[#d33028] border-[#d33028] text-white'
                : 'bg-[#d33028]/10 border-[#d33028]/30 text-[#d33028]'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[82%] space-y-2 p-3.5 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#d33028] text-white rounded-tr-none font-medium shadow-sm'
                : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-line">{msg.content}</p>

              {msg.relevantTimestamps && msg.relevantTimestamps.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#d33028]" /> Video Timestamps:
                  </span>
                  {msg.relevantTimestamps.map((ts, i) => (
                    <span key={i} className="bg-[#d33028]/10 text-[#d33028] font-mono px-2 py-0.5 rounded border border-[#d33028]/30">
                      {ts.timestamp}
                    </span>
                  ))}
                </div>
              )}

              {msg.modelUsed && (
                <div className="text-[9px] text-zinc-400 text-right pt-0.5">
                  Model: {msg.modelUsed}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-[#d33028] font-medium p-2 bg-[#d33028]/10 border border-[#d33028]/20 rounded-xl max-w-xs animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>AI Agent is analyzing transcript chunks...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI Agent about this lesson..."
          className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#d33028]"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2.5 rounded-xl bg-[#d33028] hover:bg-[#b82720] text-white font-bold transition disabled:opacity-50 shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
