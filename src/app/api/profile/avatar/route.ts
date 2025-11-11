import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Helper function to get file type display name
const getFileTypeDisplayName = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  };
  return typeMap[mimeType] || mimeType;
};

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please log in to upload a profile picture' 
      }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        message: 'Please select an image file to upload' 
      }, { status: 400 });
    }

    // Enhanced file validation with detailed error messages
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        message: `Only JPEG, PNG, WebP, and GIF images are allowed. You uploaded: ${getFileTypeDisplayName(file.type)}`,
        allowedTypes: ALLOWED_TYPES.map(getFileTypeDisplayName)
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large',
        message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}. Your file is ${formatFileSize(file.size)}`,
        maxSize: formatFileSize(MAX_FILE_SIZE),
        fileSize: formatFileSize(file.size)
      }, { status: 400 });
    }

    // Additional validation using ApiErrorHandler for consistency
    ApiErrorHandler.validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES
    });

    // Generate unique filename with user ID
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (process.env.NODE_ENV === 'development') { console.log(`[AVATAR_UPLOAD] User ${user.id} uploading file: ${file.name} (${formatFileSize(file.size)})`); }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if exists
        cacheControl: '3600' // Cache for 1 hour
      });

    if (uploadError) {
      console.error('[AVATAR_UPLOAD] Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Upload failed',
        message: 'Failed to save your profile picture. Please try again.',
        details: uploadError.message
      }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user metadata with avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: urlData.publicUrl,
        avatar_updated: new Date().toISOString(),
        avatar_filename: fileName
      }
    });

    if (updateError) {
      console.error('[AVATAR_UPLOAD] User metadata update error:', updateError);
      // Try to clean up the uploaded file
      await supabase.storage.from('avatars').remove([fileName]);
      
      return NextResponse.json({ 
        error: 'Profile update failed',
        message: 'Failed to update your profile. Please try again.',
        details: updateError.message
      }, { status: 500 });
    }

    if (process.env.NODE_ENV === 'development') { console.log(`[AVATAR_UPLOAD] Success for user ${user.id}: ${urlData.publicUrl}`); }

    return NextResponse.json({
      success: true,
      avatar_url: urlData.publicUrl,
      message: 'Profile picture updated successfully',
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileTypeDisplayName(file.type)
      }
    });

  } catch (error) {
    console.error('[AVATAR_UPLOAD] Unexpected error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}

export async function DELETE(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please log in to remove your profile picture' 
      }, { status: 401 });
    }

    // Get current avatar info from user metadata
    const currentAvatarUrl = user.user_metadata?.avatar_url;
    const currentAvatarFilename = user.user_metadata?.avatar_filename;

    if (process.env.NODE_ENV === 'development') { console.log(`[AVATAR_DELETE] User ${user.id} removing avatar: ${currentAvatarUrl}`); }

    // Delete specific file if we have the filename
    if (currentAvatarFilename) {
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([currentAvatarFilename]);

      if (deleteError) {
        console.error('[AVATAR_DELETE] Failed to delete specific file:', deleteError);
        // Continue with metadata update even if file deletion fails
      }
    } else {
      // Fallback: Delete all avatar files for this user (legacy cleanup)
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (listError) {
        console.error('[AVATAR_DELETE] Error listing user files:', listError);
      } else if (files && files.length > 0) {
        // Delete all files in the user's folder
        const filesToDelete = files.map(file => `${user.id}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('[AVATAR_DELETE] Error deleting files from storage:', deleteError);
        } else {
          if (process.env.NODE_ENV === 'development') { console.log(`[AVATAR_DELETE] Deleted ${filesToDelete.length} files for user ${user.id}`); }
        }
      }
    }

    // Remove avatar from user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: null,
        avatar_updated: new Date().toISOString(),
        avatar_filename: null
      }
    });

    if (updateError) {
      console.error('[AVATAR_DELETE] Error removing user avatar metadata:', updateError);
      return NextResponse.json({ 
        error: 'Profile update failed',
        message: 'Failed to remove your profile picture. Please try again.',
        details: updateError.message
      }, { status: 500 });
    }

    if (process.env.NODE_ENV === 'development') { console.log(`[AVATAR_DELETE] Success for user ${user.id}`); }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    console.error('[AVATAR_DELETE] Unexpected error:', error);
    return ApiErrorHandler.handleError(error, context);
  }
}
