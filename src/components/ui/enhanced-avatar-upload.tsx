'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  Trash2,
  AlertTriangle
} from "lucide-react";
import Image from 'next/image';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Utility functions for better user experience
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeDisplayName = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
  };
  return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Unknown';
};

const getCompressionSuggestion = (fileSize: number): string => {
  const oversizeRatio = fileSize / MAX_FILE_SIZE;
  if (oversizeRatio > 3) {
    return 'Try using image compression tools or reducing image dimensions significantly.';
  } else if (oversizeRatio > 2) {
    return 'Consider compressing the image or reducing its quality.';
  } else {
    return 'Try compressing the image slightly to reduce file size.';
  }
};

export function EnhancedAvatarUpload({ 
  name, 
  imageUrl, 
  onImageUpdate, 
  size = 'lg',
  showRemoveButton = true,
  allowEdit = true
}: EnhancedAvatarUploadProps) {
  const t = useTranslations('EnhancedProfileForm.profilePicture');
  const tCommon = useTranslations('Common');
  const tToasts = useTranslations('toasts');
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragValidation, setDragValidation] = useState<{ isValid: boolean; message?: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file: File): { isValid: boolean; error?: string; suggestion?: string; details?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type: ${getFileTypeDisplayName(file.type)}`,
        suggestion: `Please select a valid image file (${ALLOWED_TYPES.map(getFileTypeDisplayName).join(', ')})`,
        details: `You uploaded a ${getFileTypeDisplayName(file.type)} file, but only image files are allowed.`
      };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large: ${formatFileSize(file.size)}`,
        suggestion: getCompressionSuggestion(file.size),
        details: `Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}, but your file is ${formatFileSize(file.size)} (${Math.round((file.size / MAX_FILE_SIZE - 1) * 100)}% larger).`
      };
    }

    // Check if file is too small (might be corrupted)
    if (file.size < 100) {
      return {
        isValid: false,
        error: 'File appears to be corrupted or empty',
        suggestion: 'Please try selecting a different image file.',
        details: `The selected file is only ${formatFileSize(file.size)}, which suggests it may be corrupted.`
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      // Show detailed error message with suggestion
      const errorMessage = validation.details || validation.error || 'Invalid file';
      const suggestionMessage = validation.suggestion ? `\n\n💡 ${validation.suggestion}` : '';
      
      showToast.error(
        validation.error || tToasts('invalidFileTitle'), 
        errorMessage + suggestionMessage
      );
      return;
    }
    
    // For files larger than 2MB, show preview dialog for confirmation
    if (file.size > 2 * 1024 * 1024) {
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreviewDialog(true);
    } else {
      // Directly upload smaller files
      uploadFile(file);
    }
  };

  const handleConfirmUpload = () => {
    if (previewFile) {
      uploadFile(previewFile);
    }
    handleClosePreview();
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl('');
    setShowPreviewDialog(false);
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
    setDragValidation(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
    
    // Check if we can validate the file during drag
    const items = Array.from(e.dataTransfer.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      if (!ALLOWED_TYPES.includes(imageItem.type)) {
        setDragValidation({
          isValid: false,
          message: `${getFileTypeDisplayName(imageItem.type)} not supported`
        });
      } else {
        setDragValidation({
          isValid: true,
          message: `${getFileTypeDisplayName(imageItem.type)} - Ready to drop`
        });
      }
    } else {
      setDragValidation({
        isValid: false,
        message: 'Please drop an image file'
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setDragValidation(null);
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
        showToast.success(tToasts('profilePictureUpdatedTitle'), tToasts('profilePictureUpdatedText'));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast.error(
        tToasts('uploadFailedTitle'), 
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
        showToast.success(tToasts('profilePictureRemovedTitle'), tToasts('profilePictureRemovedText'));
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      showToast.error(
        tToasts('removeFailedTitle'), 
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
              alt={t('profilePictureAlt')} 
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
              (isHovered || dragActive) && !isUploading ? "opacity-100" : "opacity-0",
              dragValidation && !dragValidation.isValid && "bg-red-600/70"
            )}>
              {dragActive ? (
                <>
                  {dragValidation ? (
                    <>
                      {dragValidation.isValid ? (
                        <CheckCircle className="w-6 h-6 text-green-300 mb-1" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-300 mb-1" />
                      )}
                      <span className={cn(
                        "text-xs font-medium text-center px-2",
                        dragValidation.isValid ? "text-green-200" : "text-red-200"
                      )}>
                        {dragValidation.message}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-white mb-1" />
                      <span className="text-white text-xs font-medium">{t('dropHere')}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-medium">{t('upload')}</span>
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
                <p>{t('removeTooltip')}</p>
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
                {imageUrl ? t('changePicture') : t('uploadPicture')}
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
                  {t('removePicture')}
                </Button>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-center space-y-1">
              <div className="text-xs text-muted-foreground">
                <p>Supported: {ALLOWED_TYPES.map(getFileTypeDisplayName).join(', ')}</p>
                <p>Maximum size: <span className="font-medium text-foreground">{formatFileSize(MAX_FILE_SIZE)}</span></p>
              </div>
              {allowEdit && (
                <p className="text-xs text-muted-foreground">
                  {t('dragDropText')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* File Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Upload Preview
              </DialogTitle>
              <DialogDescription>
                Review your image before uploading
              </DialogDescription>
            </DialogHeader>
            
            {previewFile && (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="flex justify-center">
                  <div className="relative">
                    <Image 
                      src={previewUrl} 
                      alt="Upload preview" 
                      width={300}
                      height={192}
                      className="max-w-full max-h-48 rounded-lg object-contain border"
                    />
                  </div>
                </div>
                
                {/* File Details */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">File name:</span>
                      <p className="font-medium truncate">{previewFile.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File type:</span>
                      <p className="font-medium">{getFileTypeDisplayName(previewFile.type)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File size:</span>
                      <p className="font-medium">{formatFileSize(previewFile.size)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className={cn(
                        "font-medium flex items-center gap-1",
                        previewFile.size > 3 * 1024 * 1024 ? "text-orange-600" : "text-green-600"
                      )}>
                        {previewFile.size > 3 * 1024 * 1024 ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Large file
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Optimal size
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Size Warning */}
                  {previewFile.size > 3 * 1024 * 1024 && (
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        This file is larger than recommended. Consider compressing it for faster uploads.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClosePreview}>
                Cancel
              </Button>
              <Button onClick={handleConfirmUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                {t('removeDialogTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('removeDialogDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveAvatar}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('removing')}
                  </>
                ) : (
                  t('removePicture')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
