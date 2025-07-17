'use client'

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ImageIcon,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedAvatarUploadProps {
  name?: string;
  imageUrl?: string;
  onImageUpdate?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRemoveButton?: boolean;
  allowEdit?: boolean;
}

const AVATAR_SIZES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function EnhancedAvatarUpload({ 
  name, 
  imageUrl, 
  onImageUpdate, 
  size = 'lg',
  showRemoveButton = true,
  allowEdit = true
}: EnhancedAvatarUploadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, WebP, or GIF)';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      showToast.error('Invalid file', error);
      return;
    }
    
    uploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Clear input to allow same file selection
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile picture');
      }

      const result = await response.json();
      
      if (result.success && onImageUpdate) {
        onImageUpdate(result.avatar_url);
        showToast.success('Profile picture updated', 'Your profile picture has been successfully updated');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast.error(
        'Upload failed', 
        error instanceof Error ? error.message : 'Failed to upload profile picture'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!imageUrl) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove profile picture');
      }

      const result = await response.json();
      
      if (result.success && onImageUpdate) {
        onImageUpdate('');
        showToast.success('Profile picture removed', 'Your profile picture has been successfully removed');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      showToast.error(
        'Remove failed', 
        error instanceof Error ? error.message : 'Failed to remove profile picture'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Container */}
        <div 
          className={cn(
            "relative group cursor-pointer transition-all duration-200",
            AVATAR_SIZES[size],
            allowEdit && "hover:scale-105",
            dragActive && allowEdit && "scale-105 ring-2 ring-primary ring-offset-2"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDrop={allowEdit ? handleDrop : undefined}
          onDragOver={allowEdit ? handleDragOver : undefined}
          onDragLeave={allowEdit ? handleDragLeave : undefined}
          onClick={allowEdit ? openFileDialog : undefined}
        >
          <Avatar className={cn(
            AVATAR_SIZES[size],
            "border-4 border-background shadow-lg transition-all duration-200",
            dragActive && "border-primary/50",
            isUploading && "opacity-50"
          )}>
            <AvatarImage 
              src={imageUrl} 
              alt={name || 'Profile picture'} 
              className="object-cover"
            />
            <AvatarFallback className={cn(
              "text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/40",
              size === 'sm' && "text-sm",
              size === 'xl' && "text-2xl"
            )}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Overlay */}
          {allowEdit && (
            <div className={cn(
              "absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center transition-opacity duration-200",
              "backdrop-blur-sm",
              (isHovered || dragActive) && !isUploading ? "opacity-100" : "opacity-0"
            )}>
              {dragActive ? (
                <>
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-medium">Drop here</span>
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-medium">Upload</span>
                </>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
              <span className="text-white text-xs font-medium">{uploadProgress}%</span>
            </div>
          )}

          {/* Remove Button */}
          {imageUrl && showRemoveButton && allowEdit && !isUploading && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove profile picture</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Success Indicator */}
          {uploadProgress === 100 && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={isUploading || !allowEdit}
          className="hidden"
        />

        {/* Upload Actions */}
        {allowEdit && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {imageUrl ? 'Change' : 'Upload'} Picture
              </Button>
              
              {imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isUploading || isDeleting}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF up to 5MB
              </p>
              {allowEdit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Click or drag & drop to upload
                </p>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Remove Profile Picture
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove your profile picture? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveAvatar}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Picture'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
