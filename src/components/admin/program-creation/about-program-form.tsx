'use client';

import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Info, Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function AboutProgramForm() {
  const { watch, setValue } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Watch form values
  const aboutContent: string = watch('aboutContent') || '';
  const thumbnailUrl: string = watch('thumbnailUrl') || '';

  // Helper function to check if HTML content is empty
  const isHtmlContentEmpty = (html: string): boolean => {
    if (!html || html.trim() === '') return true;
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent === '' || textContent === '&nbsp;';
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'program-thumbnail');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setValue('thumbnailUrl', data.url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    } finally {
      setIsUploading(false);
    }
  }, [setValue]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Remove thumbnail
  const removeThumbnail = () => {
    setValue('thumbnailUrl', '');
  };

  // Update about content
  const updateAboutContent = (content: string) => {
    setValue('aboutContent', content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-5 w-5" />
          About This Program
        </h3>
        <p className="text-sm text-muted-foreground">
          Create an engaging about page with rich content and a thumbnail image to attract users to your training program
        </p>
      </div>

      {/* Thumbnail Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Thumbnail</CardTitle>
          <CardDescription>
            Upload an attractive thumbnail image that represents your program (recommended: 16:9 aspect ratio, max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thumbnailUrl ? (
            // Show uploaded thumbnail
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={thumbnailUrl}
                    alt="Program thumbnail"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Image
                </Button>
              </div>
            </div>
          ) : (
            // Show upload area
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Upload Program Thumbnail</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag and drop an image here, or click to browse
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                  disabled={isUploading}
                  className="mx-auto"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {/* About Content Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Program Description</CardTitle>
          <CardDescription>
            Write a comprehensive description of your training program including goals, methodology, and what users can expect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="about-content">About Content</Label>
            <RichTextEditor
              content={aboutContent}
              onChange={updateAboutContent}
              placeholder="Describe your training program in detail. Include information about the methodology, target audience, expected results, duration, and any special requirements or recommendations..."
              className="min-h-[400px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                About Page Summary
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Content overview for your program&apos;s about page
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {thumbnailUrl ? '✓' : '○'} Thumbnail
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {thumbnailUrl ? 'Added' : 'Missing'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {!isHtmlContentEmpty(aboutContent) ? '✓' : '○'} Content
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!isHtmlContentEmpty(aboutContent) ? 'Complete' : 'Empty'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {!thumbnailUrl && isHtmlContentEmpty(aboutContent) && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>Tip:</strong> Adding a thumbnail image and rich content description will make your program more attractive to potential users.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}