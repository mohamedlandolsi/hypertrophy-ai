'use client';

import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Crown } from 'lucide-react';
import { UpgradeButton } from './upgrade-button';

interface MessageLimitIndicatorProps {
  messagesUsed: number;
  dailyLimit: number;
  plan: 'FREE' | 'PRO';
  className?: string;
}

export function MessageLimitIndicator({ 
  messagesUsed, 
  dailyLimit, 
  plan,
  className = '' 
}: MessageLimitIndicatorProps) {
  // Don't show for Pro users
  if (plan === 'PRO') {
    return null;
  }

  const messagesRemaining = Math.max(0, dailyLimit - messagesUsed);
  const progressPercentage = (messagesUsed / dailyLimit) * 100;
  const isNearLimit = progressPercentage >= 80;
  const isAtLimit = messagesUsed >= dailyLimit;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Messages</span>
          <span className="font-medium">
            {messagesUsed} / {dailyLimit}
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2"
          // Change color based on usage
          style={{
            '--progress-background': isAtLimit 
              ? 'rgb(239 68 68)' // red
              : isNearLimit 
                ? 'rgb(245 158 11)' // amber
                : 'rgb(59 130 246)' // blue
          } as React.CSSProperties}
        />
        <div className="text-xs text-muted-foreground">
          {messagesRemaining} messages remaining today
        </div>
      </div>

      {/* Warning/Limit Messages */}
      {isAtLimit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You&apos;ve reached your daily message limit. Upgrade to Pro for unlimited messages.
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isAtLimit && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You&apos;re running low on messages. Only {messagesRemaining} left today.
          </AlertDescription>
        </Alert>
      )}

      {/* Upgrade CTA */}
      {(isAtLimit || isNearLimit) && (
        <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="h-4 w-4 text-yellow-500" />
            Unlock unlimited messaging
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            Get unlimited messages, conversation memory, and advanced coaching features.
          </div>
          <UpgradeButton variant="outline" size="sm" showDialog={true} />
        </div>
      )}
    </div>
  );
}
