'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, ShieldCheck, CheckCircle2, ArrowLeft, Clapperboard } from 'lucide-react';

export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const certNumber = (params.certificateNumber as string) || 'CERT-2026-PREMIUM';

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[#141414] border border-white/10 rounded-xl p-8 space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 bg-[#E50914]/20 text-[#E50914] rounded-full flex items-center justify-center mx-auto border border-[#E50914]/30">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>OFFICIALLY VERIFIED CERTIFICATE</span>
          </div>
          <h1 className="text-2xl font-black text-white pt-2">Creators Lab Certificate Audit</h1>
          <p className="text-xs font-mono text-[#B3B3B3]">{certNumber}</p>
        </div>

        <div className="bg-[#0B0B0B] border border-white/10 p-5 rounded-lg text-xs space-y-3 text-left">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-[#B3B3B3]">Recipient</span>
            <span className="font-bold text-white">Maya Sharma</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-[#B3B3B3]">Course Mastery</span>
            <span className="font-bold text-white">Full-Stack Next.js 14 & React Masterclass</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-[#B3B3B3]">Completion Status</span>
            <span className="font-bold text-emerald-400">100% Curriculum Completed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#B3B3B3]">Issuer Security</span>
            <span className="font-bold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Creators Lab SHA-256</span>
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-6 py-3 rounded-md transition shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Creators Lab</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
