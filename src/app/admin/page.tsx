'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, BookOpen, DollarSign, TrendingUp, ArrowRight, PlusCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function AdminDashboardPage() {
  const { courses, orders } = useAppStore();

  const [stats, setStats] = useState({
    totalSales: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.status === 'PUBLISHED').length,
    totalUsers: 3,
    successfulOrders: orders.length
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveStats = () => {
    setIsLoading(true);
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#E50914]" />
              <h1 className="text-3xl font-extrabold text-white">Admin Control Console</h1>
            </div>
            <p className="text-xs text-[#B3B3B3]">Live MongoDB Atlas aggregate metrics, editorial gatekeeping, user RBAC, and revenue logs</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLiveStats}
              className="p-2.5 bg-[#141414] hover:bg-white/10 border border-white/15 rounded-md text-[#B3B3B3] hover:text-white transition"
              title="Refresh Live Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/admin/courses"
              className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-4 py-2.5 rounded-md flex items-center gap-2 transition shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create & Manage Courses</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
              <span>Gross Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">₹{stats.totalSales.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-400 font-semibold">Live Razorpay Webhook Aggregation</p>
          </div>

          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
              <span>Total Learning Modules</span>
              <BookOpen className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalCourses}</div>
            <p className="text-[11px] text-[#B3B3B3]">{stats.publishedCourses} Modules Live & Published</p>
          </div>

          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
              <span>Registered Accounts</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
            <p className="text-[11px] text-[#B3B3B3]">MongoDB Atlas Encrypted Users</p>
          </div>

          <div className="bg-[#141414] border border-white/10 p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
              <span>Completed Orders</span>
              <CheckCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.successfulOrders}</div>
            <p className="text-[11px] text-amber-400 font-semibold">100% Fulfilled Orders</p>
          </div>
        </div>

        {/* Quick Navigation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/courses"
            className="bg-[#141414] border border-white/10 hover:border-[#E50914]/50 p-6 rounded-xl space-y-3 group transition"
          >
            <div className="p-3 bg-red-500/20 text-[#E50914] rounded-lg w-max border border-[#E50914]/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-red-400 transition">Course Catalog Gatekeeper</h3>
            <p className="text-xs text-[#B3B3B3]">Approve, edit, publish or draft learning modules across categories.</p>
            <div className="text-xs font-bold text-[#E50914] flex items-center gap-1 pt-2">
              <span>Manage Courses</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-[#141414] border border-white/10 hover:border-[#E50914]/50 p-6 rounded-xl space-y-3 group transition"
          >
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-lg w-max border border-sky-500/30">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-red-400 transition">User & Student Management</h3>
            <p className="text-xs text-[#B3B3B3]">Audit student enrollments, inspect progress, and manage platform roles.</p>
            <div className="text-xs font-bold text-[#E50914] flex items-center gap-1 pt-2">
              <span>Manage Users</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-[#141414] border border-white/10 hover:border-[#E50914]/50 p-6 rounded-xl space-y-3 group transition"
          >
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg w-max border border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base group-hover:text-red-400 transition">Orders & Transactions</h3>
            <p className="text-xs text-[#B3B3B3]">Inspect Razorpay payment IDs, order timestamps, and revenue logs.</p>
            <div className="text-xs font-bold text-[#E50914] flex items-center gap-1 pt-2">
              <span>View Orders</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
