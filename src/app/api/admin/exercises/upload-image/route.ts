import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to upload images.'
      }, { status: 401 });
    }

    // Check if user is admin using Prisma (consistent with other endpoints)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Admin access required',
        message: 'Only administrators can upload exercise images.'
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        message: 'Please select a file to upload.'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large',
        message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: 'Only images (JPEG, PNG, GIF, WebP) are allowed.'
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `exercises/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('exercise-images')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({
        error: 'Upload failed',
        message: error.message || 'Failed to upload image to storage.'
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      imageType: file.type,
      message: 'Image uploaded successfully.'
    });

  } catch (error) {
    console.error('[EXERCISE_IMAGE_UPLOAD] Error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

// DELETE endpoint to remove exercise images
export async function DELETE(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is admin using Prisma (consistent with other endpoints)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Get image path from request body
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({
        error: 'No image URL provided'
      }, { status: 400 });
    }

    // Extract path from URL
    const urlParts = imageUrl.split('/exercise-images/');
    if (urlParts.length < 2) {
      return NextResponse.json({
        error: 'Invalid image URL'
      }, { status: 400 });
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from('exercise-images')
      .remove([`exercises/${filePath}`]);

    if (error) {
      console.error('Supabase storage deletion error:', error);
      return NextResponse.json({
        error: 'Deletion failed',
        message: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully.'
    });

  } catch (error) {
    console.error('[EXERCISE_IMAGE_DELETE] Error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}
