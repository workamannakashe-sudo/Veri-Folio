import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'VeriFolio - Mentor-Verified Skill Portfolios',
  description: 'A named mentor linked through the school roster confirmed these skills on this date.',
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[var(--text)] bg-[var(--bg1)] selection:bg-[var(--cyan)] selection:text-black antialiased">
        <Providers>
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="orb absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.35)_0%,transparent_70%)] blur-[40px] will-change-transform" />
            <div className="orb absolute top-1/3 -right-20 w-[30rem] h-[30rem] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.3)_0%,transparent_70%)] blur-[50px] will-change-transform" />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
