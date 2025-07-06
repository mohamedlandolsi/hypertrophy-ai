import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from '@/components/conditional-navbar'; // Import ConditionalNavbar
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import FaviconMeta from "@/components/favicon-meta";
import ErrorBoundary from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Your personal AI fitness coach",
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/favicon/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Coach'
  },
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-config': '/favicon/browserconfig.xml'
  }
};

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
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
