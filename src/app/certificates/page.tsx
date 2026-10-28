'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Download, ExternalLink, CheckCircle2, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function CertificatesPage() {
  const { courses, currentUser, userProgress } = useAppStore();

  const completedCourses = courses.filter(course => {
    const courseId = course.id || (course as any)._id || course.slug;
    const prog = userProgress[courseId] || { completedLessonIds: [] };
    const allLessons = course.sections.flatMap(s => s.lessons);
    return allLessons.length > 0 && prog.completedLessonIds.length === allLessons.length;
  });

  return (
    <div className="bg-white text-zinc-900 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Accredited Certifications</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">Official Certificates</h1>
          <p className="text-xs text-zinc-500">Issued automatically upon 100% course curriculum completion with unique QR verification</p>
        </div>

        {/* Content */}
        {completedCourses.length === 0 ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto">
            <Award className="w-12 h-12 text-zinc-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-zinc-900 font-bold text-base">No certificates earned yet</h3>
              <p className="text-xs text-zinc-500">Complete 100% of any course lessons to generate your official certificate.</p>
            </div>
            <Link
              href="/my-learning"
              className="inline-flex items-center gap-2 btn-soft font-bold text-xs px-6 py-3 rounded-md transition"
            >
              <span>Go to My Learning</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedCourses.map((course, idx) => {
              const certId = `CERT-2026-${(course.id || '001').toUpperCase()}`;
              return (
                <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200 font-bold">
                        {certId}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Verified
                      </span>
                    </div>

                    <h3 className="font-bold text-zinc-900 text-base">{course.title}</h3>
                    <p className="text-xs text-zinc-500">Awarded to <span className="text-zinc-900 font-bold">{currentUser.name}</span></p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/verify/${certId}`}
                      target="_blank"
                      className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-bold text-xs px-4 py-2 rounded-md transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-brand" />
                      <span>Public Verification</span>
                    </Link>

                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        alert(`Downloading certificate PDF for ${certId}...`);
                      }}
                      className="btn-soft font-bold text-xs px-4 py-2 rounded-md transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
