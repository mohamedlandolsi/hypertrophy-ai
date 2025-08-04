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
import { Crown, MessageSquare, FileUp, Database, Headphones } from 'lucide-react';
import { UpgradeButton } from '@/components/upgrade-button';

interface UpgradeLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyLimit: number;
}

export function UpgradeLimitDialog({ 
  open, 
  onOpenChange, 
  dailyLimit = 15 
}: UpgradeLimitDialogProps) {
  const t = useTranslations('ChatPage.dialogs.upgradeLimitReached');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const benefits = [
    {
      icon: MessageSquare,
      text: t('benefits.unlimited')
    },
    {
      icon: FileUp,
      text: t('benefits.files')
    },
    {
      icon: Database,
      text: t('benefits.knowledge')
    },
    {
      icon: Headphones,
      text: t('benefits.support')
    }
  ];

  const handleUpgradeClick = () => {
    onOpenChange(false);
    setShowUpgradeDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t('description', { limit: dailyLimit })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                {t('benefits.title')}
              </h4>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <benefit.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Start your unlimited journey today
                </p>
                <p className="text-xs text-muted-foreground">
                  Join thousands of users building their dream physique
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('later')}
            </Button>
            <Button
              onClick={handleUpgradeClick}
              className="flex-1 gradient-primary text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              {t('upgradeNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Button Dialog */}
      <UpgradeButton 
        showDialog={showUpgradeDialog}
        variant="default"
        className="hidden" // Hidden since we're only using the dialog
      />
    </>
  );
}
