'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, ShieldCheck, Sparkles } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide global footer on full-screen watch pages to keep theater player & AI agent clean
  if (pathname?.startsWith('/watch')) {
    return null;
  }

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 text-zinc-600 text-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d33028] text-white flex items-center justify-center shadow-lg shadow-[#d33028]/20">
              <Clapperboard className="w-5 h-5 fill-current" />
            </div>
            <span className="font-black text-lg text-zinc-900 tracking-wider uppercase">
              CREATORS<span className="text-[#d33028]">LAB</span>
            </span>
          </div>
          <p className="text-zinc-500 leading-relaxed">
            Enterprise-ready Learning Management System architected for zero-latency video streaming, instant certificates, and Razorpay payments.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md w-max">
            <ShieldCheck className="w-4 h-4" />
            <span>MongoDB & Cloudflare R2 Engine</span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider">Creative Disciplines</h4>
          <ul className="space-y-2">
            <li><Link href="/courses?category=cinematography-directing" className="hover:text-[#d33028] transition">Cinematography & Directing</Link></li>
            <li><Link href="/courses?category=photography-visual-arts" className="hover:text-[#d33028] transition">Photography & Visual Arts</Link></li>
            <li><Link href="/courses?category=video-editing-color-grading" className="hover:text-[#d33028] transition">Video Editing & Color Grading</Link></li>
            <li><Link href="/courses?category=motion-design-3d-vfx" className="hover:text-[#d33028] transition">3D Animation & Motion Design</Link></li>
            <li><Link href="/courses?category=music-production-audio" className="hover:text-[#d33028] transition">Music Production & Sound</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider">Platform Links</h4>
          <ul className="space-y-2">
            <li><Link href="/courses" className="hover:text-[#d33028] transition">All Courses Catalog</Link></li>
            <li><Link href="/my-learning" className="hover:text-[#d33028] transition">Student Learning Center</Link></li>
            <li><Link href="/certificates" className="hover:text-[#d33028] transition">Certificate Verification</Link></li>
            <li><Link href="/admin" className="hover:text-[#d33028] transition">Admin Console</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider">Security & SLA</h4>
          <p className="text-zinc-500 leading-relaxed">
            Razorpay 256-bit encrypted payments. 99.9% video stream uptime delivered via global Cloudflare edge CDN.
          </p>
          <div className="pt-2 text-zinc-400 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#d33028]" />
            <span>Creators Lab Platform © 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
