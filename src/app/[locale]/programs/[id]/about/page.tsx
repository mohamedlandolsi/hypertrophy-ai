'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, ArrowLeft, ShoppingCart, Star, Calendar, Crown, Sparkles,
  CheckCircle2, Users, Clock, BarChart3, Target, Dumbbell, TrendingUp,
  Shield, Smartphone, Download, MessageCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TrainingProgram {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: number;
  lemonSqueezyId?: string;
  lemonSqueezyVariantId?: string;
  isActive: boolean;
  thumbnailUrl?: string;
  aboutContent?: string;
  createdAt: string;
  isOwned?: boolean;
  hasPurchased?: boolean;
  hasProAccess?: boolean;
}

export default function ProgramAboutPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.id as string;
  
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgram() {
      if (!programId) return;
      
      setIsLoading(true);
      try {
        // Check authentication
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setIsAuthenticated(!!user && !userError);

        // Fetch specific program details
        const response = await fetch(`/api/programs/${programId}`);
        if (!response.ok) {
          throw new Error('Program not found');
        }

        const data = await response.json();
        if (data.success) {
          setProgram(data.program);
        } else {
          throw new Error(data.error || 'Failed to load program');
        }

      } catch (error) {
        console.error('Error loading program:', error);
        setError(error instanceof Error ? error.message : 'Failed to load program');
      } finally {
        setIsLoading(false);
      }
    }

    loadProgram();
  }, [programId]);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceInCents / 100);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (!program) return;

    // Check if user has Pro access (can access without purchase)
    if (program.hasProAccess) {
      router.push(`/programs/${programId}/guide`);
      return;
    }

    // Check if program is free
    if (program.price === 0) {
      // Free program - redirect to guide page
      router.push(`/programs/${programId}/guide`);
      return;
    }

    // Check if already purchased
    if (program.hasPurchased) {
      router.push(`/programs/${programId}/guide`);
      return;
    }

    // Check if LemonSqueezy IDs are configured
    if (!program.lemonSqueezyId || !program.lemonSqueezyVariantId) {
      setError('This program is not available for purchase at the moment. Please contact support.');
      return;
    }

    try {
      setIsPurchasing(true);
      setError(null);

      // Call API to create checkout URL
      const response = await fetch('/api/checkout/create-program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programId: program.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.checkoutUrl) {
        // Redirect to LemonSqueezy checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setError(error instanceof Error ? error.message : 'Failed to create checkout');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleBackToPrograms = () => {
    router.push('/programs');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Program Not Found</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {error || 'The requested program could not be found or may no longer be available.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToPrograms}>
                Back to Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const programName = program.name.en || Object.values(program.name)[0] || 'Unknown Program';
  const programDescription = program.description.en || Object.values(program.description)[0] || 'No description available';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBackToPrograms}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Programs
        </Button>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Enhanced Hero Section */}
        <div className="text-center space-y-6">
          {/* Social Proof */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ))}
              <span className="ml-2 text-sm font-medium">4.8 (240 reviews)</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              <span className="font-medium">500+ users</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{programName}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {programDescription}
            </p>
          </div>
          
          {/* Key Specs Bar */}
          <div className="flex items-center justify-center gap-6 flex-wrap p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">12 Weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium">4-6 Days/Week</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">Moderate Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="font-medium">All Levels</span>
            </div>
          </div>

          {/* Price Display - Bigger & Bolder */}
          <div className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-primary">
              {program.price === 0 ? 'FREE' : formatPrice(program.price)}
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              One-time purchase • Lifetime access
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              onClick={handlePurchase}
              size="lg"
              className="h-14 text-lg"
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : program.hasProAccess || program.hasPurchased ? (
                <>
                  <Star className="h-5 w-5 mr-2" />
                  View Program
                </>
              ) : isAuthenticated ? (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {program.price === 0 ? 'Access Program' : 'Purchase Now'}
                </>
              ) : (
                'Sign In to Purchase'
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 text-lg"
              onClick={() => router.push(`/programs/${programId}/guide`)}
            >
              <Download className="h-5 w-5 mr-2" />
              Preview Sample
            </Button>
          </div>
        </div>

        {/* Program Thumbnail */}
        {program.thumbnailUrl && (
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={program.thumbnailUrl}
                  alt={programName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced About This Program Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">About This Program</CardTitle>
            <CardDescription className="text-base">
              Everything you need to know about this training program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Intro Paragraph */}
            {program.aboutContent ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: program.aboutContent }}
              />
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                This comprehensive training program is designed to help you achieve your fitness goals through structured, science-based programming. 
                Whether you&apos;re a beginner or advanced lifter, this program adapts to your needs and schedule.
              </p>
            )}

            <Separator />

            {/* What You'll Get */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                What You&apos;ll Get:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Train each muscle twice per week for optimal growth</span>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Choose 4-day split or flexible 2-on-1-off cycle</span>
                </li>
                <li className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Balance upper and lower body development</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>Perfect recovery time between sessions</span>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Who It's For */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Who It&apos;s For:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Beginners through advanced lifters</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Anyone preferring 4 sessions per week</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Those wanting flexible scheduling</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">Lifters focusing on balanced development</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Sample Workout Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sample Workout Preview</CardTitle>
            <CardDescription className="text-base">
              See what a typical training day looks like
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold">Exercise</th>
                    <th className="pb-3 font-semibold text-center">Sets</th>
                    <th className="pb-3 font-semibold text-center">Reps</th>
                    <th className="pb-3 font-semibold text-center">Rest</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3">Barbell Back Squat</td>
                    <td className="py-3 text-center">4</td>
                    <td className="py-3 text-center">8-12</td>
                    <td className="py-3 text-center">2-3 min</td>
                  </tr>
                  <tr>
                    <td className="py-3">Romanian Deadlift</td>
                    <td className="py-3 text-center">3</td>
                    <td className="py-3 text-center">10-12</td>
                    <td className="py-3 text-center">2 min</td>
                  </tr>
                  <tr>
                    <td className="py-3">Leg Press</td>
                    <td className="py-3 text-center">3</td>
                    <td className="py-3 text-center">12-15</td>
                    <td className="py-3 text-center">90 sec</td>
                  </tr>
                  <tr>
                    <td className="py-3">Leg Curl</td>
                    <td className="py-3 text-center">3</td>
                    <td className="py-3 text-center">12-15</td>
                    <td className="py-3 text-center">90 sec</td>
                  </tr>
                  <tr>
                    <td className="py-3">Calf Raises</td>
                    <td className="py-3 text-center">4</td>
                    <td className="py-3 text-center">15-20</td>
                    <td className="py-3 text-center">60 sec</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              This is just Day 1 - Lower Body. Full program includes complete weekly schedule.
            </p>
          </CardContent>
        </Card>

        {/* What's Included Checklist */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">What&apos;s Included</CardTitle>
            <CardDescription className="text-base">
              Everything you need for training success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, text: 'Complete 12-week program with customization tools' },
                { icon: Dumbbell, text: '200+ exercise database with muscle contribution data' },
                { icon: MessageCircle, text: 'AI assistant for unlimited questions' },
                { icon: Smartphone, text: 'Mobile app with workout logging & progress tracking' },
                { icon: TrendingUp, text: 'Advanced volume tracking system' },
                { icon: Crown, text: 'Lifetime access + all future improvements' },
                { icon: Target, text: 'Personalized exercise substitutions' },
                { icon: BarChart3, text: 'Detailed progress analytics and reports' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">What Users Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Alex Thompson',
                role: 'Intermediate Lifter',
                avatar: 'A',
                rating: 5,
                text: 'Best program I&apos;ve used. The customization options let me work around my shoulder injury while still making great progress.',
              },
              {
                name: 'Maria Garcia',
                role: 'Advanced Athlete',
                avatar: 'M',
                rating: 5,
                text: 'The volume tracking feature is a game-changer. I can see exactly when I&apos;m pushing too hard or need to increase intensity.',
              },
              {
                name: 'James Chen',
                role: 'Beginner',
                avatar: 'J',
                rating: 5,
                text: 'As a beginner, the AI assistant helped me understand proper form and programming. Worth every penny!',
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-base">
              Get answers to common questions about this program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger className="text-left">
                  Do I need any special equipment?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  This program is designed for a standard gym setup with barbells, dumbbells, and machines. 
                  You can substitute exercises if certain equipment isn&apos;t available.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger className="text-left">
                  Can I customize the exercises?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely! The program includes 200+ exercises, and you can substitute any exercise based on 
                  your preferences, equipment availability, or injury considerations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger className="text-left">
                  How does the AI assistant work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The AI assistant is trained on exercise science and can answer questions about form, programming, 
                  recovery, and nutrition. Ask unlimited questions anytime during your training.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger className="text-left">
                  What if I miss a workout?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The program is flexible. You can adjust your schedule, and the volume tracking will help you 
                  maintain proper progression even if you miss sessions occasionally.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger className="text-left">
                  Is this suitable for home training?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  While designed for gym training, you can adapt it for home use if you have basic equipment 
                  (barbell, dumbbells, bench). The customization features make it easy to substitute exercises.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger className="text-left">
                  Do I get updates if the program improves?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! One-time purchase includes lifetime access to all future updates, improvements, and 
                  new features added to this program.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7">
                <AccordionTrigger className="text-left">
                  What&apos;s your refund policy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer a 30-day money-back guarantee. If you&apos;re not satisfied with the program for any 
                  reason, contact support for a full refund.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Enhanced Purchase Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl md:text-4xl font-bold">
              {program.hasPurchased || program.hasProAccess ? 'You Have Access!' : 'Ready to Get Started?'}
            </CardTitle>
            <CardDescription className="text-lg">
              {program.hasProAccess
                ? 'Pro membership: Full access to this program and all others'
                : program.hasPurchased 
                ? 'Access your personalized training plan and start building today' 
                : 'Join 500+ users training smarter with customizable programming, real-time volume tracking, and AI-powered guidance'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Pro Access Badge */}
            {program.hasProAccess && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">Pro Member - Full Access</span>
              </div>
            )}

            {/* Pricing Display - Large & Bold */}
            {!program.hasPurchased && !program.hasProAccess && (
              <div className="text-center space-y-4">
                <div className="text-5xl md:text-6xl font-bold text-primary">
                  {program.price === 0 ? 'FREE' : formatPrice(program.price)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>One-time purchase • Lifetime access • All future updates</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>30-Day Money-Back Guarantee • Instant Access</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center">
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Button
                onClick={handlePurchase}
                className="flex-1 h-14 text-lg"
                size="lg"
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : program.hasProAccess || program.hasPurchased ? (
                  <>
                    <Star className="h-5 w-5 mr-2" />
                    View Program
                  </>
                ) : isAuthenticated ? (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {program.price === 0 ? 'Access Program' : 'Purchase Now'}
                  </>
                ) : (
                  'Sign In to Purchase'
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={() => router.push(`/programs/${programId}/guide`)}
              >
                <Download className="h-5 w-5 mr-2" />
                Preview Free Sample
              </Button>
            </div>

            {/* What's Included Summary */}
            {!program.hasPurchased && !program.hasProAccess && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-center">What&apos;s Included:</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: CheckCircle2, text: 'Complete 12-week program with customization tools' },
                      { icon: Dumbbell, text: '200+ exercise database with muscle contribution data' },
                      { icon: MessageCircle, text: 'AI assistant for unlimited questions' },
                      { icon: Smartphone, text: 'Mobile app with workout logging & progress tracking' },
                      { icon: TrendingUp, text: 'Lifetime access + all future improvements' },
                      { icon: Shield, text: '30-day money-back guarantee' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <item.icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Pro Upgrade Option - Only show for non-Pro users on paid programs */}
            {isAuthenticated && !program.hasProAccess && !program.hasPurchased && program.price > 0 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or get unlimited access
                    </span>
                  </div>
                </div>

                <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 flex items-center gap-2">
                            Upgrade to Pro
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Best Value
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Get unlimited access to all training programs for just $19/month
                          </p>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              Access to all current programs
                            </li>
                            <li className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              Future programs included free
                            </li>
                            <li className="flex items-center gap-1">
                              <Crown className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                              Premium support priority
                            </li>
                          </ul>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push('/pricing')}
                        variant="outline"
                        className="w-full border-purple-300 dark:border-purple-700"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        View Pro Plans
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Additional Info */}
            {!isAuthenticated && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign up here
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}