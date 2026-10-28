'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

const DISCIPLINES = [
  { href: '/courses?category=cinematography-directing', label: 'Cinematography & Directing' },
  { href: '/courses?category=photography-visual-arts', label: 'Photography & Visual Arts' },
  { href: '/courses?category=video-editing-color-grading', label: 'Editing & Color Grading' },
  { href: '/courses?category=motion-design-3d-vfx', label: '3D Animation & Motion' },
  { href: '/courses?category=music-production-audio', label: 'Music & Sound' }
];

const PLATFORM = [
  { href: '/courses', label: 'All Courses' },
  { href: '/my-learning', label: 'My Learning' },
  { href: '/certificates', label: 'Certificate Verification' },
  { href: '/wishlist', label: 'Wishlist' }
];

export default function Footer() {
  const pathname = usePathname();

  // Hide global footer on full-screen watch pages to keep theater player & AI agent clean
  if (pathname?.startsWith('/watch')) {
    return null;
  }

  return (
    <footer className="glow-soft border-t border-[#E9E7FA] text-sm text-ink-body">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="flex flex-col gap-3.5">
          <Link href="/" className="self-start">
            <img src="/Logo-Creators-Lab.png" alt="Creators Lab" className="h-12 w-auto" />
          </Link>
          <p className="leading-[1.65]">
            Learn filmmaking, design, 3D and sound from working professionals.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="font-semibold text-ink mb-1">Disciplines</h4>
          {DISCIPLINES.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-ink transition">{link.label}</Link>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="font-semibold text-ink mb-1">Platform</h4>
          {PLATFORM.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-ink transition">{link.label}</Link>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="font-semibold text-ink mb-1">Secure payments</h4>
          <p className="leading-[1.65]">Payments processed by Razorpay with 256-bit encryption.</p>
          <div className="mt-1 self-start flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured checkout</span>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-8 border-t border-[#EDEAF7] text-[13px] text-[#6B6785]">
        © 2026 Creators Lab
      </div>
    </footer>
  );
}
