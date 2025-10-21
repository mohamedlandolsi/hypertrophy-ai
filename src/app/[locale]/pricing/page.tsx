'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Crown, Check, Star, Zap, Target,
  Shield, CreditCard, Lock,
  Gift, DollarSign, ArrowRight, Sparkles,
  BarChart3, Clock, Infinity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { UpgradeButton } from '@/components/upgrade-button';
import { CurrencySelector } from '@/components/currency-selector';
import Head from 'next/head';
import { useLocale } from 'next-intl';
import { 
  type CurrencyCode, 
  type PricingData,
  getPricingForCurrency,
  getDefaultCurrency,
  getDefaultCurrencySync
} from '@/lib/currency';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

interface ProgramShowcase {
  id: string;
  title: string;
  focus: string;
  price: number;
  rating: number;
  imageUrl?: string;
}

export default function NewPricingPage() {
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [programCount, setProgramCount] = useState(3);
  const [featuredPrograms, setFeaturedPrograms] = useState<ProgramShowcase[]>([]);

  // Sticky CTA state for mobile
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        
        try {
          const response = await fetch('/api/user/plan');
          if (response.ok) {
            const planData = await response.json();
            setUserPlan(planData.plan);
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
        }
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const initializeCurrency = async () => {
      setIsLoadingPricing(true);
      try {
        const syncCurrency = getDefaultCurrencySync();
        setSelectedCurrency(syncCurrency);
        
        const defaultCurrency = await getDefaultCurrency();
        setSelectedCurrency(defaultCurrency);
        
        const pricing = await getPricingForCurrency(defaultCurrency);
        setPricingData(pricing);
      } catch (error) {
        console.error('Error initializing currency:', error);
        const fallbackCurrency = getDefaultCurrencySync();
        setSelectedCurrency(fallbackCurrency);
        try {
          const pricing = await getPricingForCurrency(fallbackCurrency);
          setPricingData(pricing);
        } catch (fallbackError) {
          console.error('Error with fallback currency:', fallbackError);
        }
      } finally {
        setIsLoadingPricing(false);
      }
    };

    initializeCurrency();
  }, []);

  // Fetch featured programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs');
        if (response.ok) {
          const data = await response.json();
          // Take first 4 active programs
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const featured = data.programs?.slice(0, 4).map((p: any) => ({
            id: p.id,
            title: p.name?.en || 'Training Program',
            focus: p.description?.en?.substring(0, 50) + '...' || '',
            price: p.price / 100, // Convert cents to dollars
            rating: 4.8,
            imageUrl: p.thumbnailUrl
          })) || [];
          setFeaturedPrograms(featured);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    };

    fetchPrograms();
  }, []);

  // Sticky CTA scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyCTA(scrollPosition > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCurrencyChange = (currency: CurrencyCode, pricing: PricingData) => {
    setSelectedCurrency(currency);
    setPricingData(pricing);
  };

  // Calculate savings for value calculator
  const individualProgramPrice = 49; // Average price
  const totalIndividualCost = (programCount * individualProgramPrice).toFixed(2);
  const proYearlyCost = (pricingData?.yearly || 149).toFixed(2);
  const savings = Math.max(0, (programCount * individualProgramPrice) - (pricingData?.yearly || 149)).toFixed(2);

  return (
    <>
      <Head>
        <title>Choose Your Path to Better Training | HypertroQ Pricing</title>
        <meta name="description" content="Buy individual programs you'll own forever, or unlock everything with Pro. 30-day money-back guarantee on all plans." />
        <meta name="keywords" content="training program pricing, hypertrophy programs, muscle building plans, workout program subscription" />
        <link rel="canonical" href="https://hypertroq.com/pricing" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-4 py-1.5">
              <Shield className="mr-1 h-3 w-3" />
              30-Day Money-Back Guarantee - No Hidden Fees
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Choose Your Path to Better Training
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12">
              Buy individual programs you&apos;ll own forever, or unlock everything with Pro
            </p>

            {/* Currency Selector */}
            <div className="flex justify-center mb-8">
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>
          </div>
        </header>

        {/* Pricing Comparison Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            
            {/* Individual Program Card */}
            <Card className="relative border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 shadow-lg">
                  <Star className="mr-1 h-3 w-3" />
                  Most Popular for Beginners
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Individual Program
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">From $29</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">One-time purchase</p>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400 min-h-[48px]">
                  Perfect for trying your first science-based program
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    '1 program of your choice',
                    'Full customization tools',
                    'Volume tracking & feedback',
                    'Exercise database access',
                    'AI assistant for that program',
                    'Mobile app access',
                    'Lifetime access',
                    'All future updates to that program'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    First-time users, specific goals, budget-conscious
                  </p>
                </div>
                
                <Link href={`/${locale}/programs`}>
                  <Button className="w-full" variant="outline" size="lg">
                    Browse Programs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Monthly Card */}
            <Card className="relative border-2 border-blue-400 hover:border-blue-500 dark:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 shadow-lg">
                  <Zap className="mr-1 h-3 w-3" />
                  Most Flexible
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Pro Monthly
                </CardTitle>
                <div className="mb-2">
                  {isLoadingPricing || !pricingData ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-blue-200 dark:bg-blue-700 rounded mb-2"></div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                        {pricingData.formattedMonthly}
                      </span>
                      <span className="text-blue-700 dark:text-blue-300">/month</span>
                    </>
                  )}
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Cancel anytime</p>
                </div>
                <CardDescription className="text-blue-700 dark:text-blue-300 min-h-[48px]">
                  Full access with monthly flexibility
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    { text: 'ALL programs (45+ and growing)', highlight: true },
                    { text: 'Full customization tools', highlight: false },
                    { text: 'Volume tracking & feedback', highlight: false },
                    { text: 'Exercise database access', highlight: false },
                    { text: 'Unlimited AI assistant', highlight: true },
                    { text: 'Mobile app access', highlight: false },
                    { text: 'Advanced workout analytics', highlight: true },
                    { text: 'Priority support', highlight: true },
                    { text: 'Early access to new programs', highlight: true },
                    { text: 'Access as long as subscribed', highlight: false }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-blue-500' : 'text-green-500'}`} />
                      <span className={`text-sm ${feature.highlight ? 'font-semibold text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Serious lifters, program variety, ongoing support
                  </p>
                </div>
                
                {!isAuthenticated ? (
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Start Free Trial
                    </Button>
                  </Link>
                ) : userPlan === 'PRO' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <UpgradeButton 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    showDialog={false}
                    defaultInterval="month"
                    currency={selectedCurrency}
                    pricingData={pricingData}
                  />
                )}
              </CardContent>
            </Card>

            {/* Pro Yearly Card - BEST VALUE */}
            <Card className="relative border-2 border-purple-500 hover:border-purple-600 dark:border-purple-400 dark:hover:border-purple-300 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 scale-105 md:scale-110">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white px-4 py-1 shadow-lg animate-pulse">
                  <Sparkles className="mr-1 h-3 w-3" />
                  BEST VALUE - Save 37%
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                  Pro Yearly
                </CardTitle>
                <div className="mb-2">
                  {isLoadingPricing || !pricingData ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-purple-200 dark:bg-purple-700 rounded mb-2"></div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                        {pricingData.formattedYearly}
                      </span>
                      <span className="text-purple-700 dark:text-purple-300">/year</span>
                      <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        ${(pricingData.yearly / 12).toFixed(2)}/month - Save $79
                      </div>
                    </>
                  )}
                </div>
                <CardDescription className="text-purple-700 dark:text-purple-300 min-h-[48px] font-medium">
                  Maximum value for committed athletes
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Everything in Pro Monthly, plus:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Save $79 per year', icon: DollarSign, highlight: true },
                    { text: '2 months free', icon: Gift, highlight: true },
                    { text: 'Lock in current price', icon: Lock, highlight: true },
                    { text: 'Annual training report', icon: BarChart3, highlight: true }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-purple-200 dark:border-purple-700">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                    <strong>Best For:</strong>
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Committed athletes, long-term goals, best value
                  </p>
                </div>
                
                {!isAuthenticated ? (
                  <Link href={`/${locale}/signup`}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Start Free Trial
                    </Button>
                  </Link>
                ) : userPlan === 'PRO' ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <UpgradeButton 
                    variant="default" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    showDialog={false}
                    defaultInterval="year"
                    currency={selectedCurrency}
                    pricingData={pricingData}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Value Calculator Section */}
        <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              See How Much You Save
            </h2>
            
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-8">
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                    How many programs do you plan to use?
                  </label>
                  <div className="flex items-center gap-6">
                    <Slider
                      value={[programCount]}
                      onValueChange={(value) => setProgramCount(value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="text-2xl font-bold px-4 py-2">
                      {programCount}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Individual purchase total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      ${totalIndividualCost}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-6">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">Pro yearly cost</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      ${proYearlyCost}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-8">
                  <p className="text-lg text-green-700 dark:text-green-400 mb-2">Your savings</p>
                  <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                    ${savings}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-4 font-medium">
                    💡 Pro pays for itself after just 3 programs!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Detailed Feature Comparison
          </h2>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Single Program</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20">Pro Monthly</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-900 dark:text-purple-100 bg-purple-50 dark:bg-purple-900/20">Pro Yearly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { feature: 'Program Access', single: '1 program', monthly: 'All programs', yearly: 'All programs' },
                  { feature: 'Price', single: '$29-79 once', monthly: '$19/month', yearly: '$149/year ($12.42/mo)' },
                  { feature: 'Program Customization', single: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'Volume Tracking', single: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'Exercise Database', single: 'Full access', monthly: 'Full access', yearly: 'Full access' },
                  { feature: 'Create Custom Exercises', single: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'AI Program Assistant', single: 'Per program', monthly: 'Unlimited', yearly: 'Unlimited' },
                  { feature: 'Mobile App', single: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'Workout Logging', single: '✓', monthly: '✓', yearly: '✓' },
                  { feature: 'Progress Analytics', single: 'Basic', monthly: 'Advanced', yearly: 'Advanced' },
                  { feature: 'New Programs', single: 'Purchase separately', monthly: 'Included', yearly: 'Included' },
                  { feature: 'Priority Support', single: '-', monthly: '✓', yearly: '✓' },
                  { feature: 'Early Access', single: '-', monthly: '✓', yearly: '✓' },
                  { feature: 'Annual Training Report', single: '-', monthly: '-', yearly: '✓' },
                  { feature: 'Duration', single: 'Lifetime', monthly: 'Month-to-month', yearly: '12 months' }
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{row.feature}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300">{row.single}</td>
                    <td className="px-6 py-4 text-sm text-center text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10">{row.monthly}</td>
                    <td className="px-6 py-4 text-sm text-center text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/10">{row.yearly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Comparison - Simplified */}
          <div className="lg:hidden space-y-4">
            {[
              { 
                title: 'Single Program',
                badge: 'From $29',
                color: 'gray',
                features: ['1 program', 'Full customization', 'Lifetime access', 'Basic analytics']
              },
              { 
                title: 'Pro Monthly',
                badge: '$19/month',
                color: 'blue',
                features: ['All programs', 'Unlimited AI', 'Advanced analytics', 'Priority support']
              },
              { 
                title: 'Pro Yearly',
                badge: '$12.42/month',
                color: 'purple',
                features: ['Everything in Monthly', 'Save $79/year', '2 months free', 'Annual report']
              }
            ].map((plan, index) => (
              <Card key={index} className={`border-2 border-${plan.color}-300 dark:border-${plan.color}-600`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    <Badge variant="secondary">{plan.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Program Showcase Section */}
        {featuredPrograms.length > 0 && (
          <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Popular Individual Programs
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Start with one of these proven programs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-8">
              {featuredPrograms.map((program) => (
                <Card key={program.id} className="hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="p-0">
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                      {program.imageUrl ? (
                        <Image 
                          src={program.imageUrl} 
                          alt={program.title} 
                          fill
                          className="object-cover rounded-t-lg" 
                        />
                      ) : (
                        <Target className="h-16 w-16 text-blue-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{program.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{program.focus}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${program.price}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{program.rating}</span>
                      </div>
                    </div>
                    <Link href={`/${locale}/programs/${program.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href={`/${locale}/programs`}>
                <Button size="lg" variant="outline">
                  Browse All Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {/* Individual Programs FAQs */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  For Individual Programs
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="faq-1" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Do I really get lifetime access?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Yes! Buy once, access forever. You&apos;ll get all future updates to that specific program at no extra cost.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Can I upgrade to Pro later?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Absolutely! You can upgrade anytime. Your purchased programs remain yours even if you cancel Pro later.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      What if I don&apos;t like the program?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      30-day money-back guarantee. If you&apos;re not satisfied, get a full refund, no questions asked.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Pro Subscription FAQs */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  For Pro Subscription
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="faq-4" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      How many programs do you have?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Currently 45+ programs covering beginner to advanced levels, with new programs added monthly.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Can I cancel anytime?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Yes! Monthly plans have zero commitment. Cancel anytime with no penalties or fees.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      What happens if I cancel?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      You&apos;ll lose access to Pro features, but any individual programs you purchased separately remain yours forever.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Is there a free trial?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Yes! Try Pro free for 7 days. No credit card required.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* General Questions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  General Questions
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="faq-8" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Which option is right for me?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Choose an individual program if you have a specific goal and want permanent ownership. Choose Pro if you want variety, plan to use multiple programs, or want advanced features.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-9" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Can I switch between yearly and monthly?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Yes! You can upgrade from monthly to yearly anytime to get the discount. Annual plans auto-renew but you can cancel before renewal.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-10" className="bg-white dark:bg-gray-800 rounded-lg px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      Do prices include the mobile app?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      Yes! All plans include full mobile app access for workout tracking and program management.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </Accordion>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: '30-Day Money-Back Guarantee', desc: 'Not satisfied? Full refund within 30 days' },
              { icon: CreditCard, title: 'Secure Payments', desc: 'Powered by Stripe with bank-level security' },
              { icon: Lock, title: 'Data Privacy', desc: 'Your data is encrypted and never shared' },
              { icon: Infinity, title: 'Lifetime Access', desc: 'Individual purchases are yours forever' },
              { icon: Zap, title: 'Instant Access', desc: 'Start customizing immediately after purchase' },
              { icon: Clock, title: 'Cancel Anytime', desc: 'Pro subscriptions have zero commitment' }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        {showStickyCTA && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-2xl">
            <div className="flex gap-2">
              <Link href={`/${locale}/programs`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  Browse Programs
                </Button>
              </Link>
              <Link href={`/${locale}/signup`} className="flex-1">
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Crown className="mr-2 h-4 w-4" />
                  Try Pro Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
