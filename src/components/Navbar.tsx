'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  Bell, 
  User as UserIcon, 
  BookOpen, 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const { currentUser, setCurrentUser, cartCourseIds, wishlistCourseIds, fetchCoursesFromApi, fetchOrdersFromApi } = useAppStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for standard transparent -> solid background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 font-sans ${
          isScrolled
            ? 'bg-white/95 border-b border-zinc-200 shadow-sm backdrop-blur-md'
            : 'bg-white/90 backdrop-blur-md border-b border-zinc-100'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-12 lg:px-16 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Authentic Logo Branding + Navigation Links */}
          <div className="flex items-center gap-8 lg:gap-10">
           <Link href="/" className="flex items-center">
              <img
                src="/Logo-Creators-Lab.png"          // Direct path relative to the public directory
                alt="Creators Lab Logo"
                width={160}              // Set intrinsic width
                height={40}              // Set intrinsic height
                className="h-8 w-auto sm:h-10" // Scales height responsively while keeping aspect ratio
                loading="eager"
              />
            </Link>

            {/* Preserved Navigation Pages */}
            <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-normal text-zinc-600">
              <Link href="/" className="hover:text-[#d33028] font-semibold transition text-zinc-900">Home</Link>
              <Link href="/courses" className="hover:text-[#d33028] transition">Browse Catalog</Link>
              {!isGuest && (
                <Link href="/my-learning" className="hover:text-[#d33028] transition">My Learning</Link>
              )}
              <Link href="/certificates" className="hover:text-[#d33028] transition">Certificates</Link>
            </nav>
          </div>

          {/* Right Action Icons (Search, Cart, Wishlist, Notifications & Profile Switcher) */}
          <div className="flex items-center gap-4 sm:gap-6 text-zinc-700">
            
            {/* Expandable Search Bar */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-zinc-100 border border-zinc-300 px-2.5 py-1 rounded transition-all duration-300">
                  <Search className="w-4 h-4 text-zinc-500 mr-2" />
                  <input
                    type="text"
                    placeholder="Search courses, skills..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    className="bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none w-36 sm:w-56"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1 hover:text-[#d33028] transition"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              className="relative p-1 hover:text-[#d33028] transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCourseIds.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#d33028] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCourseIds.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 hover:text-[#d33028] transition"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCourseIds.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#d33028] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCourseIds.length}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <button className="relative p-1 hover:text-[#d33028] transition hidden sm:block" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d33028] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                11
              </span>
            </button>

            {/* Instructor Studio Shortcut */}
            {isInstructor && (
              <Link
                href="/instructor"
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 hidden sm:flex items-center gap-1.5 hover:bg-emerald-100 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Instructor Studio</span>
              </Link>
            )}

            {/* Admin Console Shortcut */}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 hidden sm:flex items-center gap-1.5 hover:bg-amber-100 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Auth / Profile Switcher */}
            {isGuest ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-[#d33028] hover:bg-[#b82720] text-white text-xs font-bold px-4 py-1.5 rounded transition shadow flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <div 
                className="relative group"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 py-1">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded object-cover border border-zinc-300"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50">
                    <div className="bg-white border border-zinc-200 rounded shadow-xl py-2 space-y-1 text-xs text-zinc-700">
                      
                      {/* Current User Header */}
                      <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                        <p className="font-bold text-zinc-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                      </div>

                      <Link
                        href="/my-learning"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 hover:text-zinc-900 transition"
                      >
                        <BookOpen className="w-4 h-4 text-[#d33028]" />
                        <span>My Learning</span>
                      </Link>

                      {isInstructor && (
                        <Link
                          href="/instructor"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-zinc-50 hover:text-emerald-800 transition"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Instructor Studio</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-amber-800 hover:bg-zinc-50 hover:text-amber-900 transition"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <div className="h-px bg-zinc-200 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full text-center px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-red-600 transition font-semibold"
                      >
                        Sign out
                      </button>
                    </div>
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
