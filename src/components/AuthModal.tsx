'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Lock, Mail, User as UserIcon, Loader2, CheckCircle, Sparkles, ShieldCheck, GraduationCap, Video } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MOCK_USERS } from '@/lib/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { setCurrentUser } = useAppStore();

  if (!isOpen) return null;

  const handleQuickLogin = (userType: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN') => {
    setIsLoading(true);
    setErrorMsg('');

    let targetEmail = 'student@creatorslab.com';
    let targetPass = 'StudentPassword123!';
    let fallbackUser = MOCK_USERS[0];

    if (userType === 'INSTRUCTOR') {
      targetEmail = 'instructor@creatorslab.com';
      targetPass = 'Instructor123!';
      fallbackUser = MOCK_USERS[1];
    } else if (userType === 'ADMIN') {
      targetEmail = 'admin@creatorslab.com';
      targetPass = 'AdminPassword123!';
      fallbackUser = MOCK_USERS[2];
    }

    setEmail(targetEmail);
    setPassword(targetPass);

    // Instant state update - zero wait time
    setCurrentUser(fallbackUser);
    setSuccessMsg(`Welcome back, ${fallbackUser.name}!`);

    // Background session cookie registration without blocking UI
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, password: targetPass })
    }).catch(() => {});

    setTimeout(() => {
      onClose();
      setIsLoading(false);
      setSuccessMsg('');

      if (userType === 'INSTRUCTOR') {
        router.push('/instructor');
      } else if (userType === 'ADMIN') {
        router.push('/admin');
      }
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const cleanEmail = email.toLowerCase().trim();
    const mockRole = cleanEmail.includes('admin') 
      ? 'SUPER_ADMIN' 
      : cleanEmail.includes('instructor') || cleanEmail.includes('philip') 
        ? 'INSTRUCTOR' 
        : role;

    const matchedUser = MOCK_USERS.find(u => u.email.toLowerCase() === cleanEmail) || {
      id: `user-${Date.now()}`,
      name: name || (cleanEmail.includes('admin') ? 'Super Admin' : cleanEmail.includes('instructor') ? 'Philip Bloom' : 'Maya Sharma'),
      email: cleanEmail,
      role: mockRole as any,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      isBlocked: false,
      enrolledCourseIds: [],
      wishlistCourseIds: [],
      createdAt: new Date().toISOString()
    };

    // Instant state update - zero wait time
    setCurrentUser(matchedUser);
    setSuccessMsg(mode === 'login' ? `Welcome back, ${matchedUser.name}!` : 'Account created successfully!');

    // Background session cookie registration without blocking UI
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { email: cleanEmail, password } : { name, email: cleanEmail, password, role };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(() => {});

    setTimeout(() => {
      onClose();
      setIsLoading(false);
      setSuccessMsg('');

      if (matchedUser.role === 'INSTRUCTOR') {
        router.push('/instructor');
      } else if (matchedUser.role === 'SUPER_ADMIN' || matchedUser.role === 'ADMIN') {
        router.push('/admin');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1C1C1C] border border-white/15 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'login' ? 'Sign In to Creators Lab' : 'Create Account'}
            </h2>
            <p className="text-[11px] text-[#B3B3B3]">Choose a 1-click demo role or enter your credentials</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#B3B3B3] hover:text-white p-1.5 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Logins */}
        <div className="p-5 pb-0 space-y-2">
          <label className="text-[10px] font-bold text-[#B3B3B3] uppercase tracking-wider">⚡ 1-Click Quick Demo Sign In</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('STUDENT')}
              disabled={isLoading}
              className="bg-[#0B0B0B] hover:bg-white/10 border border-white/15 hover:border-red-500/40 p-2.5 rounded-lg text-left transition flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </div>
              <span className="text-[10px] text-[#B3B3B3] truncate">Maya Sharma</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('INSTRUCTOR')}
              disabled={isLoading}
              className="bg-[#0B0B0B] hover:bg-white/10 border border-white/15 hover:border-emerald-500/40 p-2.5 rounded-lg text-left transition flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Video className="w-3.5 h-3.5" />
                <span>Instructor</span>
              </div>
              <span className="text-[10px] text-[#B3B3B3] truncate">Philip Bloom</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={isLoading}
              className="bg-[#0B0B0B] hover:bg-white/10 border border-white/15 hover:border-amber-500/40 p-2.5 rounded-lg text-left transition flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <span className="text-[10px] text-[#B3B3B3] truncate">Super Admin</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative px-5 my-4">
          <div className="absolute inset-0 flex items-center px-5">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#1C1C1C] px-2 text-[#B3B3B3]">Or continue with email</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-md text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-white">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#B3B3B3] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/15 rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-white">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#B3B3B3] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="student@creatorslab.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-white/15 rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#B3B3B3] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-white/15 rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-white">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`py-1.5 rounded-md border text-xs font-semibold ${
                    role === 'STUDENT'
                      ? 'bg-[#E50914]/20 border-[#E50914] text-red-300'
                      : 'bg-[#0B0B0B] border-white/15 text-[#B3B3B3]'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('INSTRUCTOR')}
                  className={`py-1.5 rounded-md border text-xs font-semibold ${
                    role === 'INSTRUCTOR'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#0B0B0B] border-white/15 text-[#B3B3B3]'
                  }`}
                >
                  Instructor
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded-md transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-xs mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          <div className="pt-1 text-center text-xs text-[#B3B3B3]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-red-400 font-bold hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-red-400 font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
