'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Bot,
  Target,
  Layers,
  Compass,
  ChartLine,
  GraduationCap,
  Send,
  Camera,
  Palette,
  Film,
  Music,
  Box,
  PenTool,
  Clapperboard,
  MonitorPlay,
  Award,
  CircleCheck
} from 'lucide-react';

const DISCIPLINES = [
  { icon: Clapperboard, label: 'Cinematography' },
  { icon: Camera, label: 'Photography' },
  { icon: Film, label: 'Video Editing' },
  { icon: Palette, label: 'Color Grading' },
  { icon: Box, label: '3D & VFX' },
  { icon: Music, label: 'Music & Sound' },
  { icon: PenTool, label: 'Creative Direction' },
  { icon: Sparkles, label: 'Motion Design' }
];

// Brand-blue ticker of disciplines
export function DisciplineMarquee() {
  const items = [...DISCIPLINES, ...DISCIPLINES];
  return (
    <div className="relative overflow-hidden">
      <div className="bg-brand-gradient py-4">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {items.map(({ icon: Icon, label }, idx) => (
            <span key={idx} className="flex items-center gap-3 text-white font-display font-semibold text-lg sm:text-xl whitespace-nowrap">
              <Icon className="w-5 h-5 text-white/80" />
              {label}
              <span className="text-white/50 ml-7">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const AGENTS = [
  { icon: Bot, title: 'AI Tutor', text: 'Ask anything mid-lesson, answered from the lesson itself.' },
  { icon: Target, title: 'Smart Checkpoints', text: 'Quick quizzes pop up right after key moments.' },
  { icon: Layers, title: 'Revision Flashcards', text: 'Spaced-repetition decks built from what you watched.' },
  { icon: Compass, title: 'Study Coach', text: 'A weekly plan that fits your schedule and goals.' },
  { icon: ChartLine, title: 'Progress Reports', text: 'See strengths, gaps and what to practise next.' },
  { icon: GraduationCap, title: 'Final Exam', text: 'Pass and earn a certificate anyone can verify.' }
];

// Dark aurora banner showcasing the AI learning agents, with a glass chat mock-up
export function AiAgentBanner() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="bg-aurora-dark relative overflow-hidden rounded-[36px] px-6 sm:px-12 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center shadow-[0_30px_60px_-30px_rgba(35,35,107,0.6)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#6366F1]/25 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <span className="glass-dark self-start inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white px-4 py-2 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#C7CBFF]" />
              AI AGENT POWERED
            </span>
            <h2 className="font-display font-semibold text-[clamp(30px,3.6vw,48px)] leading-[1.12] tracking-[-0.02em] text-white">
              A personal AI mentor <span className="text-gradient-light">beside every lesson</span>
            </h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-white/75 max-w-[520px]">
              Six learning agents work together so you never study alone — from your first question to your final certificate.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AGENTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="glass-dark rounded-2xl p-4 flex gap-3 transition hover:bg-white/20">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-white/15 text-[#C7CBFF] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-display font-semibold text-sm text-white">{title}</div>
                    <div className="text-xs leading-[1.5] text-white/65 mt-0.5">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat mock-up */}
          <div className="relative">
            <div className="glass-dark animate-float-slow rounded-[28px] p-5 sm:p-6 flex flex-col gap-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-3 pb-4 border-b border-white/15">
                <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.15)]">
                  <img src="/agent-icon.png" alt="" className="w-7 h-7 object-contain" />
                </span>
                <div className="flex-1">
                  <div className="font-display font-semibold text-white text-sm">Creators Lab AI</div>
                  <div className="text-xs text-[#7FF5C8] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7FF5C8]" /> Online · Lesson 3
                  </div>
                </div>
              </div>

              <div className="self-end max-w-[85%] bg-white text-ink text-sm leading-[1.55] px-4 py-3 rounded-2xl rounded-br-md">
                Why does a 50mm lens feel more natural than a 24mm?
              </div>
              <div className="self-start max-w-[90%] bg-white/15 border border-white/20 text-white text-sm leading-[1.6] px-4 py-3 rounded-2xl rounded-bl-md">
                Its field of view is close to how your eyes focus attention, so perspective isn&apos;t stretched. Rewatch the lens comparison in this lesson and notice how the background changes.
              </div>
              <div className="self-start glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl btn-gradient text-white flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Checkpoint ready</div>
                  <div className="text-xs text-ink-muted">3 quick questions · 1 min</div>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-4 pr-1.5 h-12">
                <span className="flex-1 text-sm text-white/50">Ask about this lesson…</span>
                <span className="w-9 h-9 rounded-full btn-gradient text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="glass-strong animate-float absolute -top-5 -left-3 sm:-left-8 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <CircleCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[13px] font-semibold text-ink">Quiz score 9/10</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: MonitorPlay, title: 'Watch', text: 'HD lessons from working pros' },
  { icon: Target, title: 'Practise', text: 'AI checkpoints & flashcards' },
  { icon: Award, title: 'Get Certified', text: 'A verifiable certificate' }
];

// Brand-blue banner with the learning path and a CTA
export function CertificateBanner({ lowestPrice }: { lowestPrice: number | null }) {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-brand-gradient relative overflow-hidden rounded-[32px] px-6 sm:px-12 py-10 sm:py-12 flex flex-col gap-8 shadow-[0_30px_60px_-30px_rgba(79,91,239,0.6)]">

          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-[560px]">
              <span className="text-xs font-semibold tracking-[0.14em] text-white/85">YOUR LEARNING PATH</span>
              <h2 className="font-display font-semibold text-[clamp(26px,3vw,40px)] leading-[1.15] text-white">
                From first lesson to certified creator
              </h2>
              {lowestPrice !== null && (
                <p className="text-white/85">Masterclasses from <span className="font-semibold text-white">₹{lowestPrice}</span> · lifetime access</p>
              )}
            </div>
            <Link
              href="/courses"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 bg-white text-brand hover:bg-lavender font-semibold text-[15px] px-7 py-4 rounded-full shadow-[0_14px_30px_-12px_rgba(0,0,0,0.35)] transition"
            >
              Start Learning
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {STEPS.map(({ icon: Icon, title, text }, idx) => (
              <div key={title} className="glass-dark rounded-2xl px-5 py-4 flex items-center gap-4">
                <span className="shrink-0 w-12 h-12 rounded-xl bg-white text-brand flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(0,0,0,0.3)]">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <div className="font-display font-semibold text-white">{idx + 1}. {title}</div>
                  <div className="text-[13px] text-white/80">{text}</div>
                </div>
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="hidden sm:block w-5 h-5 text-white/60 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
