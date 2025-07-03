import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      // Check if user exists in our database, create if not
      const appUser = await prisma.user.upsert({
        where: { id: session.user.id },
        update: {}, // Don't update anything if user exists
        create: {
          id: session.user.id,
          role: 'user',
          hasCompletedOnboarding: false,
        },
        select: { hasCompletedOnboarding: true }
      });

      // If the user hasn't completed onboarding, send them to the wizard
      if (!appUser.hasCompletedOnboarding) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Otherwise, send them to the main chat page or next parameter
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
