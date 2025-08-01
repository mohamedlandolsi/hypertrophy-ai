import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import FaviconMeta from "@/components/favicon-meta";
import ErrorBoundary from "@/components/error-boundary";
import { Analytics } from '@vercel/analytics/react';
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { OfflineBanner } from "@/components/offline-banner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { GoogleAnalytics } from '@/components/google-analytics';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = generateSEOMetadata({
  title: "HypertroQ - AI-Powered Personal Fitness Coach",
  description: "Transform your fitness journey with HypertroQ, your AI-powered personal trainer. Get personalized workout plans, nutrition guidance, and expert coaching available 24/7.",
  keywords: [
    "AI fitness coach",
    "personal trainer", 
    "workout plans",
    "fitness coaching",
    "AI personal trainer",
    "fitness app",
    "hypertrophy training",
    "muscle building",
    "strength training",
    "fitness guidance"
  ]
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <FaviconMeta />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HypertroQ" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col h-full`}
      >
        {/* LemonSqueezy Script - Only load when needed */}
        {/* Removed global loading to prevent unauthorized API calls */}
        {/* Script is now loaded conditionally in components that need it */}
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <ServiceWorkerRegister />
            <OfflineBanner />
            <main className="flex-1 flex flex-col">{children}</main>
            <SonnerToaster richColors position="top-right" />
            <Toaster />
            <Analytics />
            <GoogleAnalytics />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
