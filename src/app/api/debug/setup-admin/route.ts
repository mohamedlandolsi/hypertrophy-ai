import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Get current authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'development') { console.log(`🔍 Current Supabase user ID: ${user.id}`); }
    if (process.env.NODE_ENV === 'development') { console.log(`📧 Current user email: ${user.email}`); }
    
    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser) {
      if (process.env.NODE_ENV === 'development') { console.log('❌ User not found in database. Creating...'); }
      
      // Create user with correct Supabase ID
      dbUser = await prisma.user.create({
        data: {
          id: user.id, // Use exact Supabase auth ID
          role: 'admin' // Make them admin immediately
        }
      });
      
      if (process.env.NODE_ENV === 'development') { console.log('✅ Created user in database with admin role'); }
    } else {
      if (process.env.NODE_ENV === 'development') { console.log('✅ User exists in database'); }
      
      // Update to admin if not already
      if (dbUser.role !== 'admin') {
        dbUser = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' }
        });
        if (process.env.NODE_ENV === 'development') { console.log('✅ Updated user role to admin'); }
      } else {
        if (process.env.NODE_ENV === 'development') { console.log('✅ User is already admin'); }
      }
    }
    
    return NextResponse.json({
      message: 'User setup complete',
      supabaseUserId: user.id,
      email: user.email,
      databaseUser: dbUser,
      isAdmin: dbUser.role === 'admin'
    });
    
  } catch (error) {
    console.error('Error setting up user:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
