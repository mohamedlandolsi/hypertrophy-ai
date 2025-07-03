'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles } from 'lucide-react';

export function OnboardingComplete() {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700 dark:text-green-300">
          <CheckCircle className="mr-2 h-5 w-5" />
          Welcome to Hypertrophy AI!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start space-x-2">
          <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Your profile has been set up successfully. Our AI coach now understands your goals, preferences, and training environment.
          </p>
        </div>
        <div className="text-xs text-green-600 dark:text-green-400">
          You can always update your profile information later in the Profile section.
        </div>
      </CardContent>
    </Card>
  );
}
