'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Ban, CheckCircle2, Eye, X, BookOpen, DollarSign, Award } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { User, Order } from '@/lib/types';

export default function AdminUsersPage() {
  const { blockUser, courses, orders } = useAppStore();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Fetch live users from MongoDB Atlas
  const loadLiveUsers = () => {
    setIsLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setUsersList(data.users);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadLiveUsers();
  }, []);

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    await blockUser(userId, !currentBlocked);
    setUsersList(usersList.map(u => (u.id === userId || (u as any)._id === userId ? { ...u, isBlocked: !currentBlocked } : u)));
  };

  const filteredUsers = usersList.filter(u => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const getStudentOrders = (email: string) => {
    return orders.filter(o => o.userEmail === email);
  };

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">User Management & Student Tracking</h1>
            <p className="text-xs text-[#B3B3B3]">Live MongoDB user directory with granular RBAC and individual student performance tracking</p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-white/15 rounded-md pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#1C1C1C] text-white font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Enrolled Courses</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map(user => {
                const uId = user.id || (user as any)._id;
                return (
                  <tr key={uId} className="hover:bg-white/5 transition">
                    <td className="p-4 flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-white/20" />
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-[11px] text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">{user.role}</td>
                    <td className="p-4 font-bold text-red-400">{user.enrolledCourseIds.length} Courses</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        user.isBlocked
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedStudent(user)}
                        className="p-1.5 rounded bg-[#1C1C1C] hover:bg-white/10 text-white border border-white/15 transition"
                        title="View Deep Student Performance"
                      >
                        <Eye className="w-4 h-4 text-red-400" />
                      </button>

                      <button
                        onClick={() => toggleBlock(uId, user.isBlocked)}
                        className={`p-1.5 rounded border text-[10px] font-bold transition ${
                          user.isBlocked
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}
                        title={user.isBlocked ? 'Unblock User' : 'Block User Access'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Deep Performance Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#1C1C1C] border-l border-white/15 text-white p-6 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-bold text-base text-white">Student Academic Audit</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-[#B3B3B3] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#0B0B0B] border border-white/10 rounded-xl">
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-12 h-12 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedStudent.name}</h4>
                  <p className="text-xs text-[#B3B3B3]">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-red-400">Payment Order Records</h4>
                {getStudentOrders(selectedStudent.email).length === 0 ? (
                  <p className="text-xs text-[#B3B3B3] italic p-3 bg-[#0B0B0B] rounded-xl">No payment transaction records found.</p>
                ) : (
                  <div className="space-y-2">
                    {getStudentOrders(selectedStudent.email).map((ord, idx) => (
                      <div key={ord.id || (ord as any)._id || `ord-${idx}`} className="p-3 bg-[#0B0B0B] border border-white/10 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">{ord.orderNumber}</div>
                          <div className="text-[11px] text-[#B3B3B3]">{ord.createdAt} • {ord.paymentGateway} ({ord.paymentId})</div>
                        </div>
                        <div className="font-extrabold text-emerald-400">₹{ord.totalAmount}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
