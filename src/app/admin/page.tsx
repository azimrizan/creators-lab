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
    <div className="bg-white text-zinc-900 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand" />
              <h1 className="text-3xl font-extrabold text-zinc-900">Admin Control Console</h1>
            </div>
            <p className="text-xs text-zinc-500">Live MongoDB Atlas aggregate metrics, editorial gatekeeping, user RBAC, and revenue logs</p>
            <Link href="/instructor/ai-studio" className="inline-flex items-center gap-2 mt-2 h-10 px-4 rounded-full btn-soft text-sm font-semibold transition">
              Open AI Studio: course content &amp; learning insights
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLiveStats}
              className="p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-md text-zinc-600 hover:text-zinc-900 transition shadow-sm"
              title="Refresh Live Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/admin/courses"
              className="btn-soft font-bold text-xs px-4 py-2.5 rounded-md flex items-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create & Manage Courses</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Gross Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-zinc-900">₹{stats.totalSales.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-700 font-semibold">Live Razorpay Webhook Aggregation</p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Total Learning Modules</span>
              <BookOpen className="w-4 h-4 text-brand" />
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.totalCourses}</div>
            <p className="text-[11px] text-zinc-500">{stats.publishedCourses} Modules Live & Published</p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Registered Accounts</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.totalUsers}</div>
            <p className="text-[11px] text-zinc-500">MongoDB Atlas Encrypted Users</p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Completed Orders</span>
              <CheckCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900">{stats.successfulOrders}</div>
            <p className="text-[11px] text-amber-600 font-semibold">100% Fulfilled Orders</p>
          </div>
        </div>

        {/* Quick Navigation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/courses"
            className="bg-white border border-zinc-200 hover:border-brand p-6 rounded-xl space-y-3 group transition shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-brand/10 text-brand rounded-lg w-max border border-brand/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base group-hover:text-brand transition">Course Catalog Gatekeeper</h3>
            <p className="text-xs text-zinc-500">Approve, edit, publish or draft learning modules across categories.</p>
            <div className="text-xs font-bold text-brand flex items-center gap-1 pt-2">
              <span>Manage Courses</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white border border-zinc-200 hover:border-brand p-6 rounded-xl space-y-3 group transition shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-sky-50 text-sky-600 rounded-lg w-max border border-sky-200">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base group-hover:text-brand transition">User & Student Management</h3>
            <p className="text-xs text-zinc-500">Audit student enrollments, inspect progress, and manage platform roles.</p>
            <div className="text-xs font-bold text-brand flex items-center gap-1 pt-2">
              <span>Manage Users</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white border border-zinc-200 hover:border-brand p-6 rounded-xl space-y-3 group transition shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg w-max border border-emerald-200">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base group-hover:text-brand transition">Orders & Transactions</h3>
            <p className="text-xs text-zinc-500">Inspect Razorpay payment IDs, order timestamps, and revenue logs.</p>
            <div className="text-xs font-bold text-brand flex items-center gap-1 pt-2">
              <span>View Orders</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
