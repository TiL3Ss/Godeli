import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProviderWrapper } from './components/SessionProviderWrapper';
import SessionNotificationWrapper from '../app/components/SessionNotificationWrapper';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s - GoDeli',
    default: 'GoDeli',
  },
  description: 'Comandas digitales para restaurantes',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
}


export const dynamic = 'force-static';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProviderWrapper>
          <SessionNotificationWrapper>
            {children}
          </SessionNotificationWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}


