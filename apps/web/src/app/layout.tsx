import type { Metadata } from 'next';
import { Playfair_Display, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'City Star Hotel & Suites | 5-Star Luxury Urban Sanctuary',
  description: 'Experience premier hospitality, bespoke suites, and world-class dining at City Star Hotel. Check availability and reserve your stay online.',
  keywords: ['City Star Hotel', 'Luxury Hotel', 'Bespoke Suites', 'Penthouse', 'Executive Rooms', 'Urban Sanctuary'],
  openGraph: {
    title: 'City Star Hotel & Suites',
    description: 'Experience premier hospitality, bespoke suites, and world-class dining.',
    url: 'https://citystaraccomodation.onrender.com',
    siteName: 'City Star Hotel',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'City Star Hotel Skyline',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable} dark`}>
      <body className="bg-[#080C15] text-slate-100 min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
