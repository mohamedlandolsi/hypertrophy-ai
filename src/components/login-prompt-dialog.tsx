'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, User, UserPlus } from "lucide-react";

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'initial' | 'messageLimit';
}

export function LoginPromptDialog({ open, onOpenChange, variant = 'initial' }: LoginPromptDialogProps) {
  const isMessageLimit = variant === 'messageLimit';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {isMessageLimit ? 'Continue the Conversation' : 'Login Required'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isMessageLimit 
              ? "You've reached the message limit for guest users. Create a free account or log in to continue your session and save your progress."
              : "You need to be logged in to chat with AI Coach. Create an account or sign in to continue."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-6">
          <Button asChild size="lg">
            <Link href="/signup" className="flex items-center justify-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login" className="flex items-center justify-center">
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          {isMessageLimit 
            ? "Keep your workout plans and progress by creating a free account"
            : "Join thousands of users getting personalized fitness guidance with AI Coach"
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
