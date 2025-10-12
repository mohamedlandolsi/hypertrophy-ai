import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ApiErrorHandler } from '@/lib/error-handler';

export const runtime = 'nodejs';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * POST /api/admin/programs/upload-guide-image
 * Upload an image for program guide content
 */
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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Admin access required',
        message: 'Only administrators can upload program guide images.'
      }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        message: 'Please select an image file to upload.'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File too large',
        message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: `Only images (JPEG, PNG, GIF, WebP) are allowed. You uploaded: ${file.type}`
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
      .substring(0, 50); // Limit length
    const fileName = `${Date.now()}-${sanitizedName}.${fileExt}`;
    const filePath = `program-guides/${fileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('program-guide-images')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '31536000', // Cache for 1 year
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return NextResponse.json({
        error: 'Upload failed',
        message: uploadError.message || 'Failed to upload image to storage.'
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('program-guide-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      filePath: filePath,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * DELETE /api/admin/programs/upload-guide-image
 * Delete an image from program guide storage
 */
export async function DELETE(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to delete images.'
      }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({
        error: 'Admin access required',
        message: 'Only administrators can delete program guide images.'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json({
        error: 'No file path provided',
        message: 'Please provide the file path to delete.'
      }, { status: 400 });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('program-guide-images')
      .remove([filePath]);

    if (deleteError) {
      console.error('Supabase storage delete error:', deleteError);
      return NextResponse.json({
        error: 'Delete failed',
        message: deleteError.message || 'Failed to delete image from storage.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
