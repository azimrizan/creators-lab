'use client';

import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Clean, lightweight Markdown component for AI Agent responses.
 * Renders bold text, bullet points, headers, timestamps, and linebreaks gracefully.
 */
export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  // Process text line by line
  const lines = content.split('\n');

  return (
    <div className={`space-y-2 text-xs leading-relaxed text-zinc-800 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Header parsing (# or ## or ###)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={lineIdx} className="font-extrabold text-zinc-900 text-sm pt-1 pb-0.5 tracking-wide">
              {parseInlineFormatting(headerText)}
            </h4>
          );
        }

        // Bullet point parsing (* or - or •)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-[#d33028] font-bold text-xs select-none">•</span>
              <span className="flex-1">{parseInlineFormatting(bulletText)}</span>
            </div>
          );
        }

        // Regular line
        return (
          <p key={lineIdx} className="leading-relaxed">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineFormatting(text: string): React.ReactNode {
  // Regex to match **bold** text, `code`, and [00:00:00] timestamps
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d{2}:\d{2}:\d{2}\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-zinc-900 tracking-wide">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-zinc-100 text-[#d33028] font-mono text-[11px] px-1.5 py-0.5 rounded border border-zinc-200">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (/^\[\d{2}:\d{2}:\d{2}\]$/.test(part)) {
      return (
        <span key={index} className="inline-flex items-center gap-1 font-mono text-[10px] bg-[#d33028]/10 text-[#d33028] px-1.5 py-0.5 rounded border border-[#d33028]/30 mx-0.5 font-bold">
          {part.slice(1, -1)}
        </span>
      );
    }

    return part;
  });
}
