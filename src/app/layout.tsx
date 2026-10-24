import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LearnHub — Production-Grade LMS Platform',
  description: 'Enterprise Learning Management System built with Next.js, MongoDB Atlas, Cloudflare R2, and Razorpay payments.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 min-h-screen flex flex-col antialiased selection:bg-[#d33028] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
