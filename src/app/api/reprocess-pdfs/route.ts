import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // In serverless mode, files are processed in memory and not stored on disk
    // Reprocessing is not available since files aren't persisted
    return NextResponse.json({
      success: false,
      message: 'Reprocessing is not available in serverless mode. Files are processed in memory during upload only.',
      processed: 0,
      results: []
    });

  } catch (error) {
    console.error('Reprocess error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
