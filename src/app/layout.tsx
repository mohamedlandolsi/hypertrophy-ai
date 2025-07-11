import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from '@/components/conditional-navbar'; // Import ConditionalNavbar
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import FaviconMeta from "@/components/favicon-meta";
import ErrorBoundary from "@/components/error-boundary";
import { Analytics } from '@vercel/analytics/react';
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
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
        <script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <ConditionalNavbar /> {/* Use ConditionalNavbar */}
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
