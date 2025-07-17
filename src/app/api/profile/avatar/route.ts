import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler } from '@/lib/error-handler';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    ApiErrorHandler.validateFile(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES
    });

    // Generate unique filename with user ID
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user metadata with avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: urlData.publicUrl,
        avatar_updated: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error('Error updating user avatar metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update avatar metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar_url: urlData.publicUrl,
      message: 'Profile picture updated successfully'
    });

  } catch (error) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all avatar files for this user (in case of different extensions)
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (listError) {
      console.error('Error listing user files:', listError);
    } else if (files && files.length > 0) {
      // Delete all files in the user's folder
      const filesToDelete = files.map(file => `${user.id}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting files from storage:', deleteError);
      }
    }

    // Remove avatar from user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: null,
        avatar_updated: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error('Error removing user avatar metadata:', updateError);
      return NextResponse.json({ error: 'Failed to remove avatar metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
