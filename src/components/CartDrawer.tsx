'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Lock, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getSafeThumbnail } from '@/lib/types';
import AuthModal from './AuthModal';
import RazorpayModal from './RazorpayModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartCourseIds, courses, removeFromCart, clearCart, currentUser, enrollUserInCourse } = useAppStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (!isOpen) return null;

  // Filter courses in cart by ID and ensure no duplicate entries
  const cartCourses = courses.filter(
    (c, index, self) => {
      const cId = c.id || (c as any)._id || c.slug;
      return (
        cartCourseIds.includes(cId) &&
        !currentUser.enrolledCourseIds.includes(cId) &&
        self.findIndex(t => (t.id || (t as any)._id || t.slug) === cId) === index
      );
    }
  );

  const rawSubtotal = cartCourses.reduce((sum, c) => sum + (c.discountPrice || c.price), 0);
  const discountAmount = appliedCoupon ? rawSubtotal * 0.2 : 0;
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * 0.18;
  const finalTotal = subtotalAfterDiscount + taxAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (couponCode.toUpperCase() === 'LEARN20' || couponCode.toUpperCase() === 'CREATORS20') {
      setAppliedCoupon(couponCode.toUpperCase());
    } else {
      setCouponError('Invalid promo code. Try "CREATORS20" for 20% off!');
    }
  };

  const handleCheckout = () => {
    if (currentUser.id === 'guest') {
      setIsAuthOpen(true);
      return;
    }
    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    cartCourses.forEach(course => {
      const courseId = course.id || (course as any)._id || course.slug;
      enrollUserInCourse(courseId, paymentId, 'RAZORPAY');
    });
    clearCart();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[#141414] border-l border-white/10 text-white shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#E50914]" />
                <h2 className="text-base font-bold text-white">Your Cart ({cartCourses.length})</h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#B3B3B3] hover:text-white p-1.5 rounded-md hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartCourses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-[#B3B3B3]">
                  <div className="p-4 rounded-full bg-[#1C1C1C] border border-white/10">
                    <ShoppingBag className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-base">Your cart is empty</p>
                    <p className="text-xs">Explore our catalog and start learning today!</p>
                  </div>
                  <Link
                    href="/courses"
                    onClick={onClose}
                    className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs px-5 py-2.5 rounded-md transition"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                cartCourses.map((course, idx) => {
                  const courseId = course.id || (course as any)._id || course.slug;
                  return (
                    <div
                      key={courseId || `cart-item-${idx}`}
                      className="bg-[#1C1C1C] border border-white/10 rounded-xl p-3.5 flex gap-3 group"
                    >
                      <img
                        src={getSafeThumbnail(course.thumbnail)}
                        alt={course.title}
                        className="w-20 h-16 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate">{course.title}</h4>
                          <p className="text-[11px] text-[#B3B3B3]">By {course.instructorName}</p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-extrabold text-red-400">
                            ₹{course.discountPrice || course.price}
                          </span>
                          <button
                            onClick={() => removeFromCart(courseId)}
                            className="text-[#B3B3B3] hover:text-red-400 p-1 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartCourses.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#1C1C1C] space-y-4">
                {/* Coupon Input */}
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#B3B3B3] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Enter CREATORS20"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="w-full bg-[#0B0B0B] border border-white/15 rounded-md pl-8 pr-3 py-2 text-xs text-white uppercase placeholder:text-slate-500 focus:outline-none focus:border-[#E50914]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#2A2A2A] hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-md border border-white/10 transition"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Code {appliedCoupon} applied (20% OFF)!
                    </p>
                  )}
                  {couponError && <p className="text-[11px] text-red-400 font-medium">{couponError}</p>}
                </form>

                {/* Price Calculation */}
                <div className="space-y-1.5 text-xs text-[#B3B3B3] pt-2 border-t border-white/10">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">₹{rawSubtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount (20%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Tax (18%)</span>
                    <span className="text-white font-medium">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-extrabold text-white">
                    <span>Total Amount</span>
                    <span className="text-red-400">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 shadow-lg text-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Razorpay Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        amount={finalTotal}
        courseTitle={cartCourses.length === 1 ? cartCourses[0].title : `${cartCourses.length} Learning Modules`}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
