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

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: data.answer,
          modelUsed: data.modelUsed,
          relevantTimestamps: data.relevantTimestamps
        };
        setMessages(prev => [...prev, agentMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'agent',
            content: `I'm having trouble processing that right now. In Philip Bloom's lesson, composition and framing help guide the eye. Try asking again!`
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'agent',
          content: 'Network connection issue. Please check your internet connection.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#141414] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="bg-gradient-to-r from-red-950/90 via-black to-amber-950/90 p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Visual Storytelling AI Agent</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Powered by Gemini Multi-Model RAG Engine</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset Quick Prompts */}
      <div className="p-3 bg-[#0B0B0B] border-b border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 text-[11px] bg-[#1C1C1C] hover:bg-[#282828] text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-white/10 transition whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar bg-[#0E0E0E]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
              msg.role === 'user'
                ? 'bg-red-600 border-red-400 text-white'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[82%] space-y-2 p-3.5 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#E50914] text-white rounded-tr-none font-medium'
                : 'bg-[#181818] border border-white/10 text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-line">{msg.content}</p>

              {msg.relevantTimestamps && msg.relevantTimestamps.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Video Timestamps:
                  </span>
                  {msg.relevantTimestamps.map((ts, i) => (
                    <span key={i} className="bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                      {ts.timestamp}
                    </span>
                  ))}
                </div>
              )}

              {msg.modelUsed && (
                <div className="text-[9px] text-slate-500 text-right pt-0.5">
                  Model: {msg.modelUsed}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-amber-400 font-medium p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-xs animate-pulse">
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
        className="p-3 bg-[#141414] border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI Agent about this lesson..."
          className="flex-1 bg-[#0B0B0B] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold transition disabled:opacity-50 shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
