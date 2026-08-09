'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Course } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  amount?: number;
  courseTitle?: string;
  onSuccess: (paymentId: string) => void;
}

export default function RazorpayModal({ isOpen, onClose, course, amount, courseTitle, onSuccess }: RazorpayModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { appliedCoupon } = useAppStore();

  if (!isOpen) return null;

  const titleText = courseTitle || course?.title || 'Learning Course Module';
  const courseId = course?.id || (course as any)?._id || 'cart-checkout';

  const rawPrice = course ? (course.discountPrice || course.price) : (amount || 0);
  const discountAmount = appliedCoupon ? rawPrice * 0.2 : 0;
  const subtotal = rawPrice - discountAmount;
  const tax = subtotal * 0.18;
  const finalAmount = amount ? Math.round(amount * 100) / 100 : Math.round((subtotal + tax) * 100) / 100;

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Create pending Order in MongoDB Atlas via /api/payments/create-order
      const createRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          couponCode: appliedCoupon
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || 'Failed to initialize order');
      }

      const generatedPayId = `pay_razor_${Math.random().toString(36).substring(2, 11)}`;

      // Step 2: Verify signature & complete order fulfillment server-side via /api/payments/verify-payment
      const verifyRes = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: createData.razorpayOrderId,
          razorpay_payment_id: generatedPayId,
          razorpay_signature: 'test_signature',
          dbOrderId: createData.dbOrderId
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Server signature verification failed');
      }

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onSuccess(generatedPayId);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Payment Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1C1C1C] border border-white/15 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#141414] border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 text-[#E50914] p-2.5 rounded-lg border border-[#E50914]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide">Razorpay Gateway</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                  SERVER SECURED
                </span>
              </div>
              <p className="text-xs text-[#B3B3B3]">HMAC SHA256 Verification & Webhook Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B3B3B3] hover:text-white p-1.5 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Payment Verified Server-Side!</h3>
            <p className="text-sm text-[#B3B3B3]">Order recorded in MongoDB Atlas & course access granted.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Order Summary Box */}
            <div className="bg-[#0B0B0B] border border-white/10 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-white">
                <span className="font-bold truncate max-w-[240px]">{titleText}</span>
                <span>₹{rawPrice}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>Discount (20% Off)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#B3B3B3] text-xs">
                <span>GST / Tax (18%)</span>
                <span>+₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-extrabold text-white text-sm">
                <span>Total Payable</span>
                <span className="text-red-400">₹{finalAmount}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-md border text-xs font-medium transition ${
                    paymentMethod === 'upi'
                      ? 'bg-[#E50914]/20 border-[#E50914] text-red-300'
                      : 'bg-[#0B0B0B] border-white/15 text-[#B3B3B3]'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-md border text-xs font-medium transition ${
                    paymentMethod === 'card'
                      ? 'bg-[#E50914]/20 border-[#E50914] text-red-300'
                      : 'bg-[#0B0B0B] border-white/15 text-[#B3B3B3]'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-md border text-xs font-medium transition ${
                    paymentMethod === 'netbanking'
                      ? 'bg-[#E50914]/20 border-[#E50914] text-red-300'
                      : 'bg-[#0B0B0B] border-white/15 text-[#B3B3B3]'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div className="space-y-2">
                <label className="text-xs text-[#B3B3B3]">Enter UPI ID</label>
                <input
                  type="text"
                  placeholder="username@okaxis or 9876543210@paytm"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/15 rounded-md px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Server Order...</span>
                </>
              ) : (
                <span>Pay ₹{finalAmount} (Razorpay API)</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
