# Internationalization Directory Migration Guide

## 🎯 **Objective**
Migrate from flat structure `/src/app/page.tsx` to locale-based structure `/src/app/[locale]/page.tsx` to enable next-intl internationalization.

## 📁 **Current Structure**
```
src/app/
├── layout.tsx              # Main layout
├── page.tsx               # Homepage
├── globals.css            # Global styles
├── actions.ts             # Server actions
├── sitemap.ts             # Sitemap
├── api/                   # API routes (keep in root)
├── admin/                 # Admin pages
├── auth/                  # Auth pages
├── chat/                  # Chat pages
├── checkout/              # Checkout pages
├── debug/                 # Debug pages
├── knowledge/             # Knowledge pages
├── loading-demo/          # Demo pages
├── login/                 # Login pages
├── onboarding/            # Onboarding pages
├── pricing/               # Pricing pages
├── profile/               # Profile pages
├── reset-password/        # Password reset
├── signup/                # Signup pages
├── theme/                 # Theme pages
└── update-password/       # Password update
```

## 🎯 **Target Structure**
```
src/app/
├── layout.tsx             # NEW: Root layout (minimal)
├── globals.css            # Stay in root
├── actions.ts             # Stay in root
├── sitemap.ts             # Stay in root
├── api/                   # Stay in root (no localization needed)
├── debug/                 # Stay in root (admin tools)
├── loading-demo/          # Stay in root (if demo)
└── [locale]/              # NEW: Locale-based pages
    ├── layout.tsx         # MOVED: Main app layout
    ├── page.tsx           # MOVED: Homepage
    ├── admin/             # MOVED: All user-facing pages
    ├── auth/
    ├── chat/
    ├── checkout/
    ├── knowledge/
    ├── login/
    ├── onboarding/
    ├── pricing/
    ├── profile/
    ├── reset-password/
    ├── signup/
    ├── theme/
    └── update-password/
```

## ⚡ **Migration Commands**

### Step 1: Create the [locale] directory
```powershell
mkdir "src\\app\\[locale]"
```

### Step 2: Move core layout and homepage
```powershell
# Move main files to [locale]
move "src\\app\\layout.tsx" "src\\app\\[locale]\\layout.tsx"
move "src\\app\\page.tsx" "src\\app\\[locale]\\page.tsx"
```

### Step 3: Move all user-facing page directories
```powershell
# Move all user-facing directories to [locale]
move "src\\app\\admin" "src\\app\\[locale]\\admin"
move "src\\app\\auth" "src\\app\\[locale]\\auth"
move "src\\app\\chat" "src\\app\\[locale]\\chat"
move "src\\app\\checkout" "src\\app\\[locale]\\checkout"
move "src\\app\\knowledge" "src\\app\\[locale]\\knowledge"
move "src\\app\\login" "src\\app\\[locale]\\login"
move "src\\app\\onboarding" "src\\app\\[locale]\\onboarding"
move "src\\app\\pricing" "src\\app\\[locale]\\pricing"
move "src\\app\\profile" "src\\app\\[locale]\\profile"
move "src\\app\\reset-password" "src\\app\\[locale]\\reset-password"
move "src\\app\\signup" "src\\app\\[locale]\\signup"
move "src\\app\\theme" "src\\app\\[locale]\\theme"
move "src\\app\\update-password" "src\\app\\[locale]\\update-password"
```

### Step 4: Files to KEEP in root `/src/app/`
- ✅ `api/` - API routes don't need localization
- ✅ `globals.css` - Global styles
- ✅ `actions.ts` - Server actions
- ✅ `sitemap.ts` - Sitemap generation
- ✅ `debug/` - Debug/admin tools
- ✅ `loading-demo/` - Demo pages (if applicable)

## 📝 **Required Code Changes After Migration**

### 1. Create New Root Layout (`src/app/layout.tsx`)
After moving the current layout, create a minimal root layout:

```tsx
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### 2. Update Locale Layout (`src/app/[locale]/layout.tsx`)
The moved layout needs locale parameter:

```tsx
// Add this interface at the top
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

// Update the function signature
export default function LocaleLayout({ 
  children, 
  params: { locale } 
}: LocaleLayoutProps) {
  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      {/* ... rest of your existing layout content ... */}
    </html>
  );
}
```

### 3. Update All Page Components
Every page component in `[locale]` needs locale parameter:

```tsx
// Before (current)
export default function HomePage() {
  return <div>Home</div>;
}

// After (with locale)
interface PageProps {
  params: { locale: string };
}

export default function HomePage({ params: { locale } }: PageProps) {
  return <div>Home</div>;
}
```

## 🔄 **Re-enable Internationalization**

After migration is complete:

### 1. Re-enable next-intl plugin in `next.config.ts`:
```typescript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
export default withNextIntl(nextConfig);
```

### 2. Re-enable middleware in `src/middleware.ts`:
```typescript
import createIntlMiddleware from 'next-intl/middleware';
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'ar', 'fr'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'as-needed'
});
```

## ✅ **Verification Steps**

After migration:
1. Start dev server: `npm run dev`
2. Test routes:
   - `http://localhost:3000/` → Should redirect to `http://localhost:3000/en`
   - `http://localhost:3000/en` → Homepage in English
   - `http://localhost:3000/ar` → Homepage in Arabic
   - `http://localhost:3000/fr` → Homepage in French

## 🚨 **Important Notes**

1. **Do this when development server is stopped** - Avoid file conflicts
2. **Make a backup** before migration: `git commit -m "Before i18n migration"`
3. **Test thoroughly** after each step
4. **API routes stay in root** - They don't need localization
5. **Update all internal links** to use locale-aware routing

## 📋 **Quick Checklist**

- [ ] Stop development server
- [ ] Create backup commit
- [ ] Create `[locale]` directory
- [ ] Move layout.tsx and page.tsx
- [ ] Move all user-facing directories
- [ ] Create new root layout
- [ ] Update locale layout with params
- [ ] Update page components with locale params
- [ ] Re-enable next-intl configuration
- [ ] Test all routes
- [ ] Update internal navigation links

Ready to start? Run the PowerShell commands in order, then let me know when you're ready for the code updates!
