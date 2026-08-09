'use client';

import React, { useState } from 'react';
import { DollarSign, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function AdminOrdersPage() {
  const { orders } = useAppStore();
  const [ordersList, setOrdersList] = useState(orders);

  const handleProcessRefund = (orderId: string) => {
    setOrdersList(
      ordersList.map(o => (o.id === orderId ? { ...o, status: 'REFUNDED' as const } : o))
    );
  };

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Financial Orders & Payment Audit</h1>
            <p className="text-xs text-[#B3B3B3]">Complete transaction log with Razorpay payment IDs, GST breakdowns, and refund workflows</p>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#1C1C1C] text-white font-bold uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Order Number</th>
                <th className="p-4">Student</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Total Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {ordersList.map((ord, idx) => (
                <tr key={ord.id || (ord as any)._id || `ord-row-${idx}`} className="hover:bg-white/5 transition">
                  <td className="p-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{ord.userName}</div>
                    <div className="text-[11px] text-slate-500">{ord.userEmail}</div>
                  </td>
                  <td className="p-4 font-semibold text-red-400">{ord.paymentGateway}</td>
                  <td className="p-4 font-mono text-[11px] text-[#B3B3B3]">{ord.paymentId}</td>
                  <td className="p-4 font-extrabold text-emerald-400">₹{ord.totalAmount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      ord.status === 'SUCCESSFUL'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {ord.status === 'SUCCESSFUL' ? (
                      <button
                        onClick={() => handleProcessRefund(ord.id)}
                        className="px-2.5 py-1 rounded bg-[#1C1C1C] hover:bg-red-500/20 hover:text-red-300 border border-white/15 text-[10px] font-semibold text-white transition flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Issue Refund</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
