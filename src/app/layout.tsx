import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AgentDock from '@/components/agents/AgentDock';

export const metadata: Metadata = {
  title: 'Creators Lab — Learn the Craft from Working Professionals',
  description: 'Cinematography, color grading, 3D, sound and design courses taught by working professionals, with an AI learning agent beside every lesson.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-white text-ink min-h-screen flex flex-col antialiased font-sans selection:bg-brand selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AgentDock />
      </body>
    </html>
  );
}
