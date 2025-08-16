import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    // If not in maintenance mode, everyone can access
    if (!isMaintenanceMode) {
      return NextResponse.json({
        success: true,
        maintenanceMode: false,
        canAccess: true
      });
    }
    
    // If in maintenance mode, check if user is admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // Not authenticated, cannot access during maintenance
      return NextResponse.json({
        success: true,
        maintenanceMode: true,
        canAccess: false,
        reason: 'maintenance_not_authenticated'
      });
    }

    // Check user role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    const isAdmin = dbUser?.role === 'admin';
    
    return NextResponse.json({
      success: true,
      maintenanceMode: true,
      canAccess: isAdmin,
      reason: isAdmin ? 'admin_bypass' : 'maintenance_user_blocked'
    });

  } catch (error) {
    console.error('Error checking maintenance status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check maintenance status'
    }, { status: 500 });
  }
}
