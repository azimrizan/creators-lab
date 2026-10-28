'use client';

import React from 'react';
import { parseTimestamp } from '@/lib/courseUtils';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
  /** When given, [m:ss] timestamps become buttons that jump the video. */
  onTimestampClick?: (seconds: number) => void;
}

/**
 * Clean, lightweight Markdown component for AI Agent responses.
 * Renders bold text, bullet and numbered lists, headers, timestamps, and linebreaks gracefully.
 */
export default function FormattedMarkdown({ content, className = '', onTimestampClick }: FormattedMarkdownProps) {
  if (!content) return null;

  // Process text line by line. Some models cite as 【3:14】; treat that like [3:14].
  const lines = content.replace(/【\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*】/g, '[$1]').split('\n');

  return (
    <div className={`space-y-2 text-[13px] leading-relaxed text-ink-body ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Header parsing (# or ## or ###)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={lineIdx} className="font-display font-semibold text-ink text-sm pt-1 pb-0.5">
              {parseInlineFormatting(headerText, onTimestampClick)}
            </h4>
          );
        }

        // Bullet point parsing (* or - or •)
        if (/^[\*\-•]\s/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-ink-muted font-bold select-none">•</span>
              <span className="flex-1">{parseInlineFormatting(bulletText, onTimestampClick)}</span>
            </div>
          );
        }

        // Numbered list parsing (1. or 1))
        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-ink-muted font-semibold select-none min-w-4">{numbered[1]}.</span>
              <span className="flex-1">{parseInlineFormatting(numbered[2], onTimestampClick)}</span>
            </div>
          );
        }

        // Regular line
        return (
          <p key={lineIdx} className="leading-relaxed">
            {parseInlineFormatting(trimmed, onTimestampClick)}
          </p>
        );
      })}
    </div>
  );
}

const TIMESTAMP = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]$/;

function parseInlineFormatting(text: string, onTimestampClick?: (seconds: number) => void): React.ReactNode {
  // Regex to match **bold** text, `code`, and [m:ss] / [hh:mm:ss] timestamps
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d{1,2}:\d{2}(?::\d{2})?\])/g);
  const boldTimestamp = /^\*\*(\d{1,2}:\d{2}(?::\d{2})?)\*\*$/;

  return parts.map((part, index) => {
    // A bold timestamp like **8:54** is treated as a jump link too
    const bold = part.match(boldTimestamp);
    if (bold) part = `[${bold[1]}]`;

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-lavender text-ink font-mono text-[11px] px-1.5 py-0.5 rounded border border-lavender-line">
          {part.slice(1, -1)}
        </code>
      );
    }

    const ts = part.match(TIMESTAMP);
    if (ts) {
      const seconds = parseTimestamp(ts[1]);
      if (onTimestampClick && seconds !== null) {
        return (
          <button
            key={index}
            type="button"
            onClick={() => onTimestampClick(seconds)}
            className="inline-flex items-center gap-1 font-mono text-[11px] btn-soft px-1.5 py-0.5 rounded-md mx-0.5 font-semibold hover:bg-brand-hover transition"
            title={`Jump to ${ts[1]}`}
          >
            ▶ {ts[1]}
          </button>
        );
      }
      return (
        <span key={index} className="inline-flex items-center font-mono text-[11px] bg-lavender text-ink px-1.5 py-0.5 rounded-md border border-lavender-line mx-0.5 font-semibold">
          {ts[1]}
        </span>
      );
    }

    return part;
  });
}
