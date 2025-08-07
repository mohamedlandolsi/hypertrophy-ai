import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const consentGiven = searchParams.get('consentGiven')
  const consentTimestamp = searchParams.get('consentTimestamp')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      // Prepare consent data
      const consentData = consentGiven === 'true' ? {
        dataProcessingConsent: true,
        consentTimestamp: consentTimestamp ? new Date(consentTimestamp) : new Date(),
      } : {};

      // Check if user exists in our database, create if not
      const appUser = await prisma.user.upsert({
        where: { id: session.user.id },
        update: {
          // Update consent if provided
          ...consentData,
        },
        create: {
          id: session.user.id,
          role: 'user',
          hasCompletedOnboarding: false,
          // Include consent data for new users
          ...consentData,
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
