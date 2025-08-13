import { Wrench, Clock, Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'maintenance' });
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function MaintenancePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('maintenance');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Status Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">{t('duration')}</span>
          </div>
          
          <div className="text-gray-300 text-sm">
            <p>{t('accessNote')}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            {t('needHelp')}
          </p>
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Mail className="w-4 h-4" />
            <a 
              href="mailto:support@hypertroq.com" 
              className="text-sm hover:text-blue-200 transition-colors"
            >
              support@hypertroq.com
            </a>
          </div>
        </div>

        {/* Return Button */}
        <div className="pt-4">
          <Link 
            href={`/${locale}`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            {t('goBack')}
          </Link>
        </div>
      </div>
    </div>
  );
}