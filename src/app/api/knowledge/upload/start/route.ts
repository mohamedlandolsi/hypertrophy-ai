import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UploadStartRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Upload start API called');
  
  try {
    console.log('🔐 Checking authentication...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    const body: UploadStartRequest = await request.json();
    const { fileName, fileSize, mimeType } = body;

    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: 'fileName, fileSize, and mimeType are required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `File type ${mimeType} is not supported` },
        { status: 400 }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `knowledge/${user.id}/${timestamp}_${sanitizedFileName}`;

    console.log('📝 Generating signed upload URL for:', filePath);

    // Create signed upload URL (valid for 1 hour)
    const { data: signedData, error: signError } = await supabase.storage
      .from('knowledge-files')
      .createSignedUploadUrl(filePath, {
        upsert: false, // Don't allow overwriting
      });

    if (signError) {
      console.error('❌ Failed to create signed upload URL:', signError);
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    console.log('✅ Signed upload URL generated successfully');

    return NextResponse.json({
      uploadUrl: signedData.signedUrl,
      token: signedData.token,
      filePath: filePath,
      expiresIn: 3600 // 1 hour
    });

  } catch (error) {
    console.error('❌ Upload start API error:', error);
    return NextResponse.json(
      { error: 'Failed to start upload: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
