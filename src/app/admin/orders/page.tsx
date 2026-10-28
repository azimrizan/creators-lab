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
    <div className="bg-white text-zinc-900 min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900">Financial Orders & Payment Audit</h1>
            <p className="text-xs text-zinc-500">Complete transaction log with Razorpay payment IDs, GST breakdowns, and refund workflows</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-800 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
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
            <tbody className="divide-y divide-zinc-200">
              {ordersList.map((ord, idx) => (
                <tr key={ord.id || (ord as any)._id || `ord-row-${idx}`} className="hover:bg-zinc-50 transition">
                  <td className="p-4 font-mono font-bold text-zinc-900">{ord.orderNumber}</td>
                  <td className="p-4">
                    <div className="font-bold text-zinc-900">{ord.userName}</div>
                    <div className="text-[11px] text-zinc-500">{ord.userEmail}</div>
                  </td>
                  <td className="p-4 font-semibold text-brand">{ord.paymentGateway}</td>
                  <td className="p-4 font-mono text-[11px] text-zinc-500">{ord.paymentId}</td>
                  <td className="p-4 font-extrabold text-emerald-700">₹{ord.totalAmount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      ord.status === 'SUCCESSFUL'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {ord.status === 'SUCCESSFUL' ? (
                      <button
                        onClick={() => handleProcessRefund(ord.id)}
                        className="px-2.5 py-1 rounded bg-zinc-50 hover:bg-rose-50 hover:text-rose-700 border border-zinc-300 text-[10px] font-semibold text-zinc-800 transition flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Issue Refund</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">Processed</span>
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
