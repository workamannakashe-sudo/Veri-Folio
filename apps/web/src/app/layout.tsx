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
      <body className="min-h-screen text-[#191A23] bg-[#9D98F2] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
