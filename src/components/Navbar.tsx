'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  Search,
  Bell,
  User as UserIcon,
  BookOpen,
  ShieldCheck,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser, cartCourseIds, wishlistCourseIds, fetchCoursesFromApi, fetchOrdersFromApi, fetchCertificatesFromApi } = useAppStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for translucent -> solid background
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
          fetchCertificatesFromApi();
        }
      })
      .catch(() => {});

    fetchCoursesFromApi();
    fetchOrdersFromApi();
  }, [setCurrentUser, fetchCoursesFromApi, fetchOrdersFromApi, fetchCertificatesFromApi]);

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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Browse Catalog' },
    ...(!isGuest ? [{ href: '/my-learning', label: 'My Learning' }] : []),
    { href: '/certificates', label: 'Certificates' }
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  const iconButton = 'relative w-11 h-11 rounded-full flex items-center justify-center text-ink-body hover:bg-lavender hover:text-ink transition';
  const countBadge = 'absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans backdrop-blur-md ${
          isScrolled
            ? 'bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-[0_10px_30px_-18px_rgba(79,70,229,0.35)]'
            : 'bg-white/30 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[72px] sm:h-[88px] flex items-center justify-between gap-4">

          {/* Logo + Navigation Links */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/Logo-Creators-Lab.png"
                alt="Creators Lab Logo"
                width={200}
                height={103}
                className="h-[54px] min-[380px]:h-[66px] sm:h-[92px] w-auto -my-3 -ml-3 sm:-ml-[22px]"
                loading="eager"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-2 transition ${
                    isActive(link.href)
                      ? 'text-ink font-semibold after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Expandable Search Bar */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="glass flex items-center px-3.5 h-10 rounded-full transition-all duration-300">
                  <Search className="w-4 h-4 text-ink-muted mr-2" />
                  <input
                    type="text"
                    placeholder="Search courses, skills..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    className="bg-transparent text-sm text-ink placeholder:text-zinc-400 focus:outline-none w-32 sm:w-56"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={iconButton}
                  aria-label="Search"
                >
                  <Search className="w-[22px] h-[22px]" />
                </button>
              )}
            </div>

            <Link href="/wishlist" className={`${iconButton} max-[379px]:hidden`} aria-label="Wishlist">
              <Heart className="w-[22px] h-[22px]" />
              {wishlistCourseIds.length > 0 && (
                <span className={countBadge}>{wishlistCourseIds.length}</span>
              )}
            </Link>

            <button onClick={() => setIsCartOpen(true)} className={iconButton} aria-label="Cart">
              <ShoppingBag className="w-[22px] h-[22px]" />
              {cartCourseIds.length > 0 && (
                <span className={countBadge}>{cartCourseIds.length}</span>
              )}
            </button>

            {!isGuest && (
              <button className={`${iconButton} hidden sm:flex`} aria-label="Notifications">
                <Bell className="w-[22px] h-[22px]" />
                <span className={countBadge}>11</span>
              </button>
            )}

            {/* Instructor Studio Shortcut */}
            {isInstructor && (
              <Link
                href="/instructor"
                className="ml-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-full border border-emerald-200 hidden lg:flex items-center gap-1.5 hover:bg-emerald-100 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Instructor Studio</span>
              </Link>
            )}

            {/* Admin Console Shortcut */}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-2 rounded-full border border-amber-200 hidden lg:flex items-center gap-1.5 hover:bg-amber-100 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Auth / Profile Switcher */}
            {isGuest ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="btn-soft ml-1 sm:ml-2 text-sm sm:text-[15px] font-semibold px-4 sm:px-7 h-10 sm:h-12 rounded-full flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            ) : (
              <div
                className="relative group ml-1"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button className="flex items-center gap-1.5 p-1 rounded-full hover:bg-lavender transition" aria-label="Account menu">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-lavender-line"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-60 z-50">
                    <div className="glass-strong rounded-2xl p-2 text-sm text-ink-body">

                      <div className="px-3 py-2.5 border-b border-[#F0EEF6] mb-1">
                        <p className="font-display font-semibold text-ink truncate">{currentUser.name}</p>
                        <p className="text-xs text-ink-muted truncate">{currentUser.email}</p>
                      </div>

                      <Link
                        href="/my-learning"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-lavender hover:text-ink transition"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>My Learning</span>
                      </Link>

                      {isInstructor && (
                        <Link
                          href="/instructor"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Instructor Studio</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-amber-800 hover:bg-amber-50 transition"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <div className="h-px bg-[#F0EEF6] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-ink-muted hover:bg-red-50 hover:text-red-600 transition font-semibold"
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
