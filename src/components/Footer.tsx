'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, ShieldCheck, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0B] border-t border-white/10 text-[#B3B3B3] text-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/20">
              <Clapperboard className="w-5 h-5 fill-current" />
            </div>
            <span className="font-black text-lg text-white tracking-wider uppercase">
              CREATORS<span className="text-[#E50914]">LAB</span>
            </span>
          </div>
          <p className="text-[#B3B3B3] leading-relaxed">
            Enterprise-ready Learning Management System architected for zero-latency video streaming, instant certificates, and Razorpay payments.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md w-max">
            <ShieldCheck className="w-4 h-4" />
            <span>MongoDB & Cloudflare R2 Engine</span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Top Categories</h4>
          <ul className="space-y-2">
            <li><Link href="/courses?category=web-development" className="hover:text-white transition">Web Development</Link></li>
            <li><Link href="/courses?category=python-data-science" className="hover:text-white transition">Python & Data Science</Link></li>
            <li><Link href="/courses?category=ui-ux-design" className="hover:text-white transition">UI/UX Product Design</Link></li>
            <li><Link href="/courses?category=cloud-devops" className="hover:text-white transition">Cloud & DevOps</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Platform Links</h4>
          <ul className="space-y-2">
            <li><Link href="/courses" className="hover:text-white transition">All Courses Catalog</Link></li>
            <li><Link href="/my-learning" className="hover:text-white transition">Student Learning Center</Link></li>
            <li><Link href="/certificates" className="hover:text-white transition">Certificate Verification</Link></li>
            <li><Link href="/admin" className="hover:text-white transition">Admin Console</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Security & SLA</h4>
          <p className="text-[#B3B3B3] leading-relaxed">
            Razorpay 256-bit encrypted payments. 99.9% video stream uptime delivered via global Cloudflare edge CDN.
          </p>
          <div className="pt-2 text-slate-500 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Creators Lab Platform © 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
