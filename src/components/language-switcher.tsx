'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' }
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState('en');

  // Extract locale from pathname
  useEffect(() => {
    const localeMatch = pathname.match(/^\/([a-z]{2})(?=\/|$)/);
    if (localeMatch) {
      setLocale(localeMatch[1]);
    }
  }, [pathname]);

  const handleLanguageChange = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    
    // Construct the new path with the selected locale (always include locale prefix)
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center justify-between cursor-pointer ${
              locale === language.code ? 'bg-muted' : ''
            }`}
            dir={language.code === 'ar' ? 'rtl' : 'ltr'}
          >
            <span className="font-medium">{language.nativeName}</span>
            <span className="text-sm text-muted-foreground ms-2">
              {language.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
