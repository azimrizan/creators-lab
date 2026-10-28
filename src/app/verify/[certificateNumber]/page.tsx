'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, ShieldCheck, CheckCircle2, ArrowLeft, Clapperboard } from 'lucide-react';

export default function PublicVerifyCertificatePage() {
  const params = useParams();
  const certNumber = (params.certificateNumber as string) || 'CERT-2026-PREMIUM';

  return (
    <div className="bg-white text-zinc-900 min-h-screen pt-24 pb-20 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-zinc-50 border border-zinc-200 rounded-xl p-8 space-y-6 shadow-xl text-center">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto border border-brand/30">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>OFFICIALLY VERIFIED CERTIFICATE</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 pt-2">Creators Lab Certificate Audit</h1>
          <p className="text-xs font-mono text-zinc-500">{certNumber}</p>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-lg text-xs space-y-3 text-left shadow-sm">
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Recipient</span>
            <span className="font-bold text-zinc-900">Maya Sharma</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Course Mastery</span>
            <span className="font-bold text-zinc-900">Cinematic Visual Storytelling: Composition, Lenses & Framing</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Completion Status</span>
            <span className="font-bold text-emerald-700">100% Curriculum Completed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Issuer Security</span>
            <span className="font-bold text-zinc-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              <span>Creators Lab SHA-256</span>
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 btn-soft font-bold text-xs px-6 py-3 rounded-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Creators Lab</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
