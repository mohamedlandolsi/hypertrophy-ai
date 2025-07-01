import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'PDF testing is not available in serverless mode. Files are processed in memory during upload only.'
  }, { status: 400 });
}
