'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, Lock, Eye, UserCheck, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrivacyPolicyPage() {
  const t = useTranslations('PrivacyPolicy');

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-foreground">
            {t('title')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        <Badge variant="outline" className="mt-4">
          {t('effectiveDate')}: January 2025
        </Badge>
      </div>

      <div className="space-y-8">
        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-6 w-6 mr-3 text-blue-600" />
              {t('sections.dataCollection.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sections.dataCollection.description')}
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">{t('sections.dataCollection.personalData.title')}</h4>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>{t('sections.dataCollection.personalData.name')}</li>
                  <li>{t('sections.dataCollection.personalData.age')}</li>
                  <li>{t('sections.dataCollection.personalData.gender')}</li>
                  <li>{t('sections.dataCollection.personalData.contact')}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground">{t('sections.dataCollection.healthData.title')}</h4>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>{t('sections.dataCollection.healthData.bodyMetrics')}</li>
                  <li>{t('sections.dataCollection.healthData.fitnessGoals')}</li>
                  <li>{t('sections.dataCollection.healthData.injuries')}</li>
                  <li>{t('sections.dataCollection.healthData.medications')}</li>
                  <li>{t('sections.dataCollection.healthData.trainingHistory')}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground">{t('sections.dataCollection.usageData.title')}</h4>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>{t('sections.dataCollection.usageData.interactions')}</li>
                  <li>{t('sections.dataCollection.usageData.preferences')}</li>
                  <li>{t('sections.dataCollection.usageData.performance')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-6 w-6 mr-3 text-green-600" />
              {t('sections.storage.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sections.storage.description')}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {t('sections.storage.supabase.title')}
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                {t('sections.storage.supabase.description')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">{t('sections.storage.security.title')}</h4>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>{t('sections.storage.security.encryption')}</li>
                <li>{t('sections.storage.security.access')}</li>
                <li>{t('sections.storage.security.monitoring')}</li>
                <li>{t('sections.storage.security.backups')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-6 w-6 mr-3 text-purple-600" />
              {t('sections.usage.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sections.usage.description')}
            </p>
            
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t('sections.usage.personalization')}</li>
              <li>{t('sections.usage.coaching')}</li>
              <li>{t('sections.usage.progress')}</li>
              <li>{t('sections.usage.communication')}</li>
              <li>{t('sections.usage.improvement')}</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-6 w-6 mr-3 text-orange-600" />
              {t('sections.rights.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sections.rights.description')}
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.access.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.access.description')}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.rectification.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.rectification.description')}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.portability.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.portability.description')}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.erasure.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.erasure.description')}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.restriction.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.restriction.description')}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{t('sections.rights.objection.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('sections.rights.objection.description')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-amber-600" />
              {t('sections.compliance.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('sections.compliance.description')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-foreground">GDPR</h4>
                <p className="text-sm text-muted-foreground">{t('sections.compliance.gdpr')}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-foreground">CCPA</h4>
                <p className="text-sm text-muted-foreground">{t('sections.compliance.ccpa')}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-foreground">PIPEDA</h4>
                <p className="text-sm text-muted-foreground">{t('sections.compliance.pipeda')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('sections.contact.title')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('sections.contact.description')}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {t('sections.contact.dpo.title')}
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                Email: privacy@hypertroq.com
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                {t('sections.contact.dpo.responseTime')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          {t('lastUpdated')}: January 2025 | Version 1.0
        </p>
      </div>
    </div>
  );
}
