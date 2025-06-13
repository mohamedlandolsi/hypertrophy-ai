import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientMemory, generateMemorySummary } from '@/lib/client-memory';

export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client memory
    const memory = await getClientMemory(user.id);
    const memorySummary = await generateMemorySummary(user.id);

    return NextResponse.json({
      success: true,
      memory: memory,
      summary: memorySummary
    });

  } catch (error) {
    console.error('Client memory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
