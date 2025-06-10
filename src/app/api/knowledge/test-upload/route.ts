import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to check if the route is working
export async function POST(request: NextRequest) {
  console.log('🧪 Simple upload test API called');
  
  try {
    console.log('📤 Parsing form data...');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    console.log('📊 Files received:', files.length);

    if (!files || files.length === 0) {
      console.log('❌ No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Just return the file info without processing
    const fileInfo = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    console.log('✅ Files info:', fileInfo);

    return NextResponse.json({ 
      message: `Received ${files.length} file(s)`,
      files: fileInfo
    });

  } catch (error) {
    console.error('❌ Simple upload test error:', error);
    return NextResponse.json(
      { error: 'Test failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
