// src/app/api/admin/knowledge-graph/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  testConnection, 
  getGraphStats, 
  queryRelatedEntities, 
  findEntityPath,
  clearKnowledgeGraph 
} from '@/lib/knowledge-graph';

// GET - Get knowledge graph statistics and test connection
export async function GET(): Promise<NextResponse> {
  try {
    // Check authentication and admin status
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your user schema)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Test Neo4j connection
    const connectionStatus = await testConnection();
    
    if (!connectionStatus) {
      return NextResponse.json({ 
        error: 'Neo4j connection failed',
        connectionStatus: false
      }, { status: 500 });
    }

    // Get graph statistics
    const stats = await getGraphStats();

    return NextResponse.json({
      message: 'Knowledge graph is operational',
      connectionStatus: true,
      stats
    });

  } catch (error) {
    console.error('Knowledge graph API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Query knowledge graph or perform operations
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'queryRelated':
        if (!params.entityName) {
          return NextResponse.json({ error: 'entityName is required' }, { status: 400 });
        }
        const related = await queryRelatedEntities(params.entityName, params.limit || 10);
        return NextResponse.json({ related });

      case 'findPath':
        if (!params.source || !params.target) {
          return NextResponse.json({ error: 'source and target are required' }, { status: 400 });
        }
        const path = await findEntityPath(params.source, params.target);
        return NextResponse.json({ path });

      case 'clearGraph':
        await clearKnowledgeGraph();
        return NextResponse.json({ message: 'Knowledge graph cleared successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Knowledge graph operation error:', error);
    return NextResponse.json({ 
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
