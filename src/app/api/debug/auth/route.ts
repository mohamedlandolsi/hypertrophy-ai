import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking authentication and user matching...');
    
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth Error:', authError);
    console.log('Supabase User ID:', user?.id);
    console.log('Supabase User Email:', user?.email);
    
    if (!user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true }
    });
    
    console.log('Database User:', dbUser);
    
    // Check all users in database
    const allUsers = await prisma.user.findMany({
      select: { id: true, role: true }
    });
    
    console.log('All Database Users:', allUsers);
    
    return NextResponse.json({
      supabaseUserId: user.id,
      supabaseUserEmail: user.email,
      databaseUser: dbUser,
      allDatabaseUsers: allUsers,
      userMatch: !!dbUser,
      isAdmin: dbUser?.role === 'admin'
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
