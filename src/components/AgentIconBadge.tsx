'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AgentIconBadgeProps {
  onClick: () => void;
  isOpen?: boolean;
}

export default function AgentIconBadge({ onClick, isOpen }: AgentIconBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-md ${
        isOpen
          ? 'bg-[#d33028] text-white border-[#d33028] shadow-[#d33028]/20'
          : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#d33028]'
      }`}
      title="Ask CREATIVE LAB AI Agent"
    >
      <div className="relative flex items-center justify-center">
        <img
          src="/IMG_2796.PNG"
          alt="AI Agent"
          className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
        />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d33028] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d33028]"></span>
        </span>
      </div>

      <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
        <span>Learn with AI Agent</span>
        <Sparkles className="w-3.5 h-3.5 text-[#d33028] animate-pulse" />
      </span>
    </button>
  );
}
