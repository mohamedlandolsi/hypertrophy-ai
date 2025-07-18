# HypertroQ Internationalization Implementation Guide

## 🌍 Current Status

✅ **Installed**: `next-intl` package
✅ **Created**: Translation files (EN, AR, FR)
✅ **Updated**: Next.js config with next-intl plugin
✅ **Enhanced**: Middleware for i18n + Supabase auth
✅ **Built**: International components (LanguageSwitcher, InternationalInput)

## 🚀 Next Steps to Complete Implementation

### 1. Restructure App Directory (Required for next-intl)

You need to move your current pages into a `[locale]` directory structure:

```bash
# Current structure:
src/app/
├── layout.tsx
├── page.tsx
├── chat/
├── pricing/
└── ...

# New structure needed:
src/app/
├── [locale]/
│   ├── layout.tsx    # Move from src/app/layout.tsx
│   ├── page.tsx      # Move from src/app/page.tsx
│   ├── chat/         # Move all your existing pages here
│   ├── pricing/
│   └── ...
└── globals.css       # Keep global styles at root
```

### 2. Create Locale Layout Component

Move your current `src/app/layout.tsx` to `src/app/[locale]/layout.tsx` and enhance it:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from "next/script";
import "../globals.css";
import ConditionalNavbar from '@/components/conditional-navbar';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import FaviconMeta from "@/components/favicon-meta";
import ErrorBoundary from "@/components/error-boundary";
import { Analytics } from '@vercel/analytics/react';
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { OfflineBanner } from "@/components/offline-banner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const locales = ['en', 'ar', 'fr'];

export async function generateMetadata({ params }: { params: { locale: string } }) {
  return generateSEOMetadata({
    title: "HypertroQ - AI-Powered Personal Fitness Coach",
    description: "Transform your fitness journey with HypertroQ, your AI-powered personal trainer.",
    // ... rest of your metadata
  });
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Fetch messages for the locale
  const messages = await getMessages();

  return (
    <html 
      lang={locale} 
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationMismatch
    >
      <head>
        <FaviconMeta />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {/* Your existing layout content */}
              <ConditionalNavbar />
              <main>{children}</main>
              <OfflineBanner />
              <ServiceWorkerRegister />
              <SonnerToaster />
              <Toaster />
              <Analytics />
            </ThemeProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>

        {/* Your existing scripts */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        {/* ... other scripts */}
      </body>
    </html>
  );
}
```

### 3. Update Components to Use Translations

#### Example: Update your chat component

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { InternationalInput } from '@/components/international-input';

export default function ChatComponent() {
  const t = useTranslations('Chat');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <InternationalInput 
        value={message}
        onChange={handleChange}
        messageKey="Chat.placeholder" // Uses translation with Arabic fallback
      />
      <button>{t('send')}</button>
    </div>
  );
}
```

#### Update your navbar

```tsx
'use client';

import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';

export default function Navbar() {
  const t = useTranslations('Navigation');
  
  return (
    <nav>
      <Link href="/chat">{t('chat')}</Link>
      <Link href="/pricing">{t('pricing')}</Link>
      <Link href="/profile">{t('profile')}</Link>
      <LanguageSwitcher />
    </nav>
  );
}
```

### 4. Enhanced Arabic Support

Your existing Arabic detection will work seamlessly with next-intl:

```tsx
// Your existing components will automatically detect Arabic content
// and switch to RTL mode, while the UI language follows next-intl locale

import { InternationalInput } from '@/components/international-input';
import { useLocale } from 'next-intl';
import { isArabicText, getTextFormatting } from '@/lib/text-formatting';

export function ChatMessage({ content }: { content: string }) {
  const locale = useLocale();
  const formatting = getTextFormatting(content);
  
  return (
    <div 
      {...formatting}
      className={`message ${formatting.className} ${locale === 'ar' ? 'rtl-ui' : 'ltr-ui'}`}
    >
      {content}
    </div>
  );
}
```

### 5. URL Structure After Implementation

Your URLs will become:
- `/` (English - default)
- `/ar` (Arabic interface)
- `/fr` (French interface)
- `/ar/chat` (Arabic interface, chat page)
- `/fr/pricing` (French interface, pricing page)

### 6. Migration Script

Create this script to help move your files:

```bash
# migration-script.sh
mkdir -p src/app/[locale]
mv src/app/layout.tsx src/app/[locale]/
mv src/app/page.tsx src/app/[locale]/
mv src/app/chat src/app/[locale]/
mv src/app/pricing src/app/[locale]/
mv src/app/profile src/app/[locale]/
# ... move all your page directories
```

## 🎯 Benefits You'll Get

### 1. **Seamless Arabic Support**
- Your existing Arabic detection works perfectly
- Mixed content (Arabic + English) handled intelligently
- RTL layout automatically applied for Arabic content

### 2. **Professional Internationalization**
- URL-based language switching (`/ar`, `/fr`)
- SEO-friendly localized URLs
- Proper language meta tags

### 3. **Enhanced User Experience**
- Language preference remembered
- Proper text direction for each language
- Native placeholders for Arabic input

### 4. **Developer Experience**
- Type-safe translations with TypeScript
- Easy to add new languages
- Centralized translation management

## 🚧 Implementation Order

1. **Move files to [locale] structure** (Most important)
2. **Update layout.tsx with NextIntlClientProvider**
3. **Add LanguageSwitcher to navbar**
4. **Gradually update components to use useTranslations**
5. **Test each language thoroughly**

## 💡 Pro Tips

- Keep your existing Arabic-aware components - they'll work even better!
- The language switcher preserves the current page context
- Arabic content detection overrides UI language for text direction
- You can mix translated UI with dynamic Arabic content seamlessly

Would you like me to help you implement any specific part of this migration?
