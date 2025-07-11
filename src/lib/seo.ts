import type { Metadata } from 'next';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  schema?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'HypertroQ - AI-Powered Personal Fitness Coach';
const DEFAULT_DESCRIPTION = 'Transform your fitness journey with HypertroQ, your AI-powered personal trainer. Get personalized workout plans, nutrition guidance, and expert coaching available 24/7.';
const DEFAULT_KEYWORDS = [
  'AI fitness coach',
  'personal trainer',
  'workout plans',
  'fitness coaching',
  'AI personal trainer',
  'fitness app',
  'hypertrophy training',
  'muscle building',
  'strength training',
  'fitness guidance'
];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hypertroq.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export function generateMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noIndex = false
}: SEOProps = {}): Metadata {
  const fullTitle = title 
    ? `${title} | HypertroQ` 
    : DEFAULT_TITLE;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'HypertroQ' }],
    creator: 'HypertroQ',
    publisher: 'HypertroQ',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonical || SITE_URL,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical || SITE_URL,
      siteName: 'HypertroQ',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@hypertroq',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      nocache: false,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };

  return metadata;
}

export function generateSchema(type: 'WebSite' | 'Organization' | 'Product' | 'Article', data: Record<string, unknown> = {}) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'WebSite':
      return {
        ...baseSchema,
        name: 'HypertroQ',
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        ...data,
      };

    case 'Organization':
      return {
        ...baseSchema,
        name: 'HypertroQ',
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [
          // Add your social media URLs here
        ],
        ...data,
      };

    case 'Product':
      return {
        ...baseSchema,
        name: 'HypertroQ AI Fitness Coach',
        description: DEFAULT_DESCRIPTION,
        brand: {
          '@type': 'Brand',
          name: 'HypertroQ',
        },
        offers: {
          '@type': 'Offer',
          price: '9.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        ...data,
      };

    case 'Article':
      return {
        ...baseSchema,
        headline: data.title || DEFAULT_TITLE,
        description: data.description || DEFAULT_DESCRIPTION,
        author: {
          '@type': 'Organization',
          name: 'HypertroQ',
        },
        publisher: {
          '@type': 'Organization',
          name: 'HypertroQ',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`,
          },
        },
        datePublished: data.datePublished || new Date().toISOString(),
        dateModified: data.dateModified || new Date().toISOString(),
        ...data,
      };

    default:
      return baseSchema;
  }
}
