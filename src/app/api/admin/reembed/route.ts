import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiErrorHandler, AuthenticationError, AuthorizationError } from '@/lib/error-handler';
import { runEmbeddingAudit, reembedMissingChunks } from '@/lib/vector-search';

/**
 * GET /api/admin/reembed - Run embedding audit
 * Admin endpoint to check embedding coverage and quality
 */
export async function GET(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Auth check - admin only
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (roleError || userData?.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    
    // Get optional userId from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;
    
    if (process.env.NODE_ENV === 'development') { console.log('🔍 Admin requested embedding audit', userId ? `for user ${userId}` : 'for all users'); }
    
    // Run comprehensive embedding audit
    const auditReport = await runEmbeddingAudit();
    
    return NextResponse.json({
      success: true,
      data: auditReport,
      message: `Embedding audit complete`
    });
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

/**
 * POST /api/admin/reembed - Reembed missing chunks
 * Admin endpoint to generate embeddings for chunks that are missing them
 */
export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    // Auth check - admin only
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Check admin role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (roleError || userData?.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { userId, batchSize = 10 } = body;
    
    if (process.env.NODE_ENV === 'development') { console.log('🔄 Admin requested reembedding process', userId ? `for user ${userId}` : 'for all users'); }
    if (process.env.NODE_ENV === 'development') { console.log(`   Batch size: ${batchSize}`); }
    
    // Run reembedding process
    const results = await reembedMissingChunks();
    
    const message = `Processed ${results.processed} chunks, skipped ${results.skipped}. ${results.message}`;
    
    return NextResponse.json({
      success: true,
      data: results,
      message
    });  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
