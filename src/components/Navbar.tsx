'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Search, User as UserIcon, BookOpen, ShieldCheck, LogOut, Award, LayoutDashboard, Clapperboard } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const { currentUser, setCurrentUser, cartCourseIds, wishlistCourseIds, fetchCoursesFromApi, fetchOrdersFromApi } = useAppStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for transparent -> solid #141414 navbar transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hydrate session from MongoDB Atlas on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetchCoursesFromApi();
    fetchOrdersFromApi();
  }, [setCurrentUser, fetchCoursesFromApi, fetchOrdersFromApi]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser({
      id: 'guest',
      name: 'Guest Learner',
      email: 'guest@learnhub.com',
      role: 'STUDENT',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      isBlocked: false,
      enrolledCourseIds: [],
      wishlistCourseIds: [],
      createdAt: new Date().toISOString()
    });
    setIsUserMenuOpen(false);
  };

  const isGuest = currentUser.id === 'guest';
  const isInstructor = currentUser.role === 'INSTRUCTOR';
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#141414] border-b border-white/10 shadow-2xl py-3'
            : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-4'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-6">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-xl tracking-wider uppercase font-sans">
                  CREATORS<span className="text-[#E50914]">LAB</span>
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <Link href="/courses" className="hover:text-white transition">Browse Catalog</Link>
              {!isGuest && (
                <Link href="/my-learning" className="hover:text-white transition">My Learning</Link>
              )}
              <Link href="/certificates" className="hover:text-white transition">Certificates</Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search courses, skills, instructors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914] transition"
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isInstructor && (
              <Link
                href="/instructor"
                className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-500/20 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instructor Studio</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-500/20 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Console</span>
              </Link>
            )}

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="relative text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCourseIds.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCourseIds.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCourseIds.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#E50914] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCourseIds.length}
                </span>
              )}
            </button>

            {/* Auth / Profile */}
            {isGuest ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold px-4 py-2 rounded-md transition shadow-lg shadow-[#E50914]/20 flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:ring-2 hover:ring-white/40 transition"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-md object-cover border border-white/20"
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/15 rounded-xl shadow-2xl p-2 z-50 space-y-1 text-xs animate-in zoom-in-95 duration-150">
                    <div className="p-3 bg-black/60 rounded-lg space-y-0.5 border border-white/10">
                      <div className="font-bold text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                      <div className="pt-1">
                        <span className="text-[9px] font-bold bg-[#E50914]/20 text-red-300 px-2 py-0.5 rounded border border-[#E50914]/30 uppercase">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/my-learning"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <BookOpen className="w-4 h-4 text-red-500" />
                      <span>My Learning</span>
                    </Link>

                    {isInstructor && (
                      <Link
                        href="/instructor"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                        <span>Instructor Studio</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-amber-300 hover:text-white hover:bg-white/10 rounded-lg transition font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
