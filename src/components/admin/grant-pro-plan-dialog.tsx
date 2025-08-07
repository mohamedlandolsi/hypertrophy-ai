'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Calendar, Clock } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface GrantProPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    displayName: string;
    plan: string;
  };
  onSuccess: () => void;
}

export function GrantProPlanDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: GrantProPlanDialogProps) {
  const t = useTranslations('AdminUsers.grantProPlan');
  const [duration, setDuration] = useState<string>('1');
  const [durationType, setDurationType] = useState<string>('months');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGrantPro = async () => {
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      showToast.error('Invalid Duration', t('invalidDuration'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/grant-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: Number(duration),
          durationType,
          reason: reason.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant PRO plan');
      }

      showToast.success(
        t('successTitle'), 
        `${user.displayName} now has PRO access for ${duration} ${durationType}`
      );
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setDuration('1');
      setDurationType('months');
      setReason('');
      
    } catch (error) {
      console.error('Error granting PRO plan:', error);
      showToast.error(
        t('failedTitle'),
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatEndDate = () => {
    if (!duration || isNaN(Number(duration))) return 'Invalid date';
    
    const now = new Date();
    const durationNum = Number(duration);
    let endDate: Date;

    switch (durationType) {
      case 'days':
        endDate = new Date(now.getTime() + (durationNum * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + durationNum);
        break;
      case 'years':
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + durationNum);
        break;
      default:
        return 'Invalid date';
    }

    return endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')} <strong>{user.displayName}</strong> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Plan Status */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('currentPlan')}</span>
              <span className={`text-sm font-bold ${
                user.plan === 'PRO' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {user.plan}
              </span>
            </div>
          </div>

          {/* Duration Input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration">{t('duration')}</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter duration"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationType">{t('timeUnit')}</Label>
              <Select value={durationType} onValueChange={setDurationType} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('days')}
                    </div>
                  </SelectItem>
                  <SelectItem value="months">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('months')}
                    </div>
                  </SelectItem>
                  <SelectItem value="years">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('years')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculated End Date */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{t('planExpiresOn')}</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 font-mono">
              {formatEndDate()}
            </p>
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('reason')}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> {t('note')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleGrantPro}
            disabled={isLoading || !duration || isNaN(Number(duration)) || Number(duration) <= 0}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isLoading ? (
              <>
                <Crown className="h-4 w-4 mr-2 animate-spin" />
                {t('granting')}
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                {t('grantAccess')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
