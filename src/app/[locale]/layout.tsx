import { NextIntlClientProvider } from 'next-intl';
import LocaleUpdater from '@/components/locale-updater';
import ConditionalNavbar from '@/components/conditional-navbar';

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Import messages directly for the specific locale
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    messages = (await import(`../../../messages/en.json`)).default; // Fallback to English
  }
  
  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LocaleUpdater />
        <ConditionalNavbar />
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
