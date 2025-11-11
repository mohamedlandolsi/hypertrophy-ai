import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { ApiErrorHandler } from '@/lib/error-handler';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'program-thumbnails';

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getFileTypeDisplayName(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
  };

  return typeMap[mimeType] || mimeType;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(-100);
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] Request received'); }
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] Authentication failed:', authError); }
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to upload a thumbnail image.'
      }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] User authenticated:', { userId: user.id }); }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] Database user:', dbUser); }

    if (!dbUser || dbUser.role !== 'admin') {
      if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] Access denied - not admin:', { dbUser }); }
      return NextResponse.json({
        error: 'Admin access required',
        message: 'Only administrators can upload training program thumbnails.'
      }, { status: 403 });
    }

    if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] Admin access confirmed'); }

    const formData = await request.formData();
    if (process.env.NODE_ENV === 'development') {
      console.log('[UPLOAD_API] FormData received, entries:', Array.from(formData.entries()).map(([key, value]) => ({
        key,
        valueType: typeof value,
        isFile: value instanceof File,
        fileName: value instanceof File ? value.name : undefined,
        fileType: value instanceof File ? value.type : undefined,
        fileSize: value instanceof File ? value.size : undefined
      })));
    }
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const existingPath = formData.get('currentPath') as string | null;

    if (process.env.NODE_ENV === 'development') {
      console.log('[UPLOAD_API] Parsed form data:', {
      hasFile: !!file,
      type,
      existingPath,
      fileDetails: file ? {
      name: file.name,
      type: file.type,
      size: file.size
      } : null
      });
    }

    if (!file) {
      if (process.env.NODE_ENV === 'development') { console.log('[UPLOAD_API] No file provided in request'); }
      return NextResponse.json({
        error: 'No file provided',
        message: 'Please select an image file to upload.'
      }, { status: 400 });
    }

    if (type !== 'program-thumbnail') {
      return NextResponse.json({
        error: 'Invalid upload type',
        message: 'Unsupported upload target. Expected program thumbnail.'
      }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: `Only JPEG, PNG, and WebP images are allowed. You uploaded: ${getFileTypeDisplayName(file.type)}`,
        allowedTypes: ALLOWED_TYPES.map(getFileTypeDisplayName)
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large',
        message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}. Your file is ${formatFileSize(file.size)}.`
      }, { status: 400 });
    }

    ApiErrorHandler.validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES
    });

    const adminSupabase = createAdminClient();

    // Clean up previously uploaded file when provided and owned by the same user
    if (existingPath && existingPath.startsWith(`${user.id}/`)) {
      await adminSupabase.storage.from(BUCKET_NAME).remove([existingPath]);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedOriginalName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'thumbnail';
  const fileName = `${user.id}/${Date.now()}-${randomUUID()}-${sanitizedOriginalName}.${fileExtension}`;

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[PROGRAM_THUMBNAIL_UPLOAD] Storage upload error:', uploadError);
      return NextResponse.json({
        error: 'Upload failed',
        message: 'Failed to upload the thumbnail image. Please try again.',
        details: uploadError.message
      }, { status: 500 });
    }

    const { data: urlData } = adminSupabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
      bucket: BUCKET_NAME
    });
  } catch (error) {
    console.error('[PROGRAM_THUMBNAIL_UPLOAD] Unexpected error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}
