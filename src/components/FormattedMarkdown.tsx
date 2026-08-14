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
    <div className={`space-y-2 text-xs leading-relaxed text-slate-200 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Header parsing (# or ## or ###)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={lineIdx} className="font-extrabold text-white text-sm pt-1 pb-0.5 tracking-wide">
              {parseInlineFormatting(headerText)}
            </h4>
          );
        }

        // Bullet point parsing (* or - or •)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-amber-400 font-bold text-xs select-none">•</span>
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
        <strong key={index} className="font-bold text-white tracking-wide">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-black/60 text-amber-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (/^\[\d{2}:\d{2}:\d{2}\]$/.test(part)) {
      return (
        <span key={index} className="inline-flex items-center gap-1 font-mono text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 mx-0.5">
          {part.slice(1, -1)}
        </span>
      );
    }

    return part;
  });
}
