'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import PulsatingButton from "@/components/magicui/pulsating-button";
import LineShadowText from "@/components/magicui/line-shadow-text";
import { Check, X, Upload, MessageSquare, TrendingUp, Zap } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBackground from "@/components/ui/animated-background";
import InteractiveLogo from "@/components/ui/interactive-logo";
import Typewriter from "@/components/ui/typewriter";
import ConnectingPath from "@/components/ui/connecting-path";
import InteractiveFeatureShowcase from "@/components/ui/interactive-feature-showcase";
import ClientOnly from "@/components/ui/client-only";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenericAnswer, setShowGenericAnswer] = useState(false);
  const [showHypertroQAnswer, setShowHypertroQAnswer] = useState(false);
  const trustBarRef = useRef(null);
  const isTrustBarInView = useInView(trustBarRef, { once: true, margin: "-50px" });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Start typewriter animation sequence
    const timer1 = setTimeout(() => setShowGenericAnswer(true), 2000);
    const timer2 = setTimeout(() => setShowHypertroQAnswer(true), 6000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated Background */}
        <ClientOnly fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-background dark:from-blue-950/20 dark:via-purple-950/20 dark:to-background" />}>
          <AnimatedBackground />
        </ClientOnly>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <ClientOnly fallback={
              <div className="h-24 w-24 md:h-32 md:w-32">
                <Image 
                  src="/logo.png"
                  alt="HypertroQ Logo"
                  width={128}
                  height={128}
                  className="h-24 w-24 md:h-32 md:w-32 object-contain"
                />
              </div>
            }>
              <InteractiveLogo 
                src="/logo.png"
                alt="HypertroQ Logo"
                width={128}
                height={128}
                className="h-24 w-24 md:h-32 md:w-32"
              />
            </ClientOnly>
          </motion.div>
          
          {user ? (
            <>
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <LineShadowText shadowColor="rgb(59, 130, 246)" className="text-6xl md:text-8xl">
                  Welcome Back
                </LineShadowText>
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Ready to continue your fitness journey? Come back to the HypertroQ chat to ask questions and get personalized coaching.
              </motion.p>
            </>
          ) : (
            <>
              <motion.h1 
                className="text-4xl md:text-7xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <LineShadowText shadowColor="rgb(59, 130, 246)" className="text-6xl md:text-8xl">
                  Train Smarter. Build Faster.
                </LineShadowText>
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Your personal exercise scientist, powered by your own trusted knowledge base. 
                <span className="text-primary font-semibold"> No myths, just results.</span>
              </motion.p>
            </>
          )}
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {loading ? (
              <div className="flex gap-4 justify-center">
                <div className="h-12 w-32 bg-muted animate-pulse rounded-md"></div>
                <div className="h-12 w-24 bg-muted animate-pulse rounded-md"></div>
              </div>
            ) : user ? (
              <div className="animate-fade-in flex justify-center">
                <PulsatingButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-xl font-semibold">
                  <Link href="/chat">Go to Chat</Link>
                </PulsatingButton>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col sm:flex-row gap-4 justify-center items-center">
                <PulsatingButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-xl font-semibold">
                  <Link href="/signup">Get Started Free</Link>
                </PulsatingButton>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3 rounded-xl border-2 hover:bg-muted/50">
                  <Link href="/login">See a Demo</Link>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Visual Element - App Screenshot */}
          {!user && (
            <motion.div 
              className="relative max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-1 shadow-2xl">
                <div className="bg-background rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center text-sm text-muted-foreground">HypertroQ Chat</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-2xl max-w-xs">
                        What&apos;s the optimal rep range for muscle growth?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted/70 px-4 py-2 rounded-2xl max-w-md">
                        <div className="flex items-center space-x-2 mb-2">
                          <Image src="/logo.png" alt="AI" width={20} height={20} className="w-5 h-5" />
                          <span className="font-semibold">HypertroQ AI</span>
                        </div>
                        For hypertrophy, the optimal range is typically <strong>5-10 reps taken to 0-2 RIR</strong> (Reps in Reserve). This maximizes mechanical tension, which is the primary driver of muscle growth.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Dynamic Trust Bar Section */}
      <motion.section 
        ref={trustBarRef}
        className="py-6 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-y border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={isTrustBarInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg font-medium text-muted-foreground">
            <span className="text-primary font-semibold">Grounded in Evidence:</span> Our AI is powered by peer-reviewed research and carefully curated knowledge by experts.
          </p>
        </div>
      </motion.section>

      {/* Enhanced HypertroQ Difference Section - Comparison with Typewriter */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <LineShadowText shadowColor="rgb(239, 68, 68)" className="text-4xl md:text-5xl">
                Tired of &apos;Bro-Science&apos;?
              </LineShadowText>
            </h2>
            <p className="text-xl text-muted-foreground">Get Evidence-Based Results.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Generic LLM Side */}
            <motion.div 
              className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-8 border-2 border-red-200 dark:border-red-800"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                  <MessageSquare className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">Generic LLM</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Question: &quot;How many reps for muscle growth?&quot;</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-4 min-h-[120px]">
                  {showGenericAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text="A good rep range for building muscle is typically 8-12 reps. You need to really &apos;feel the burn&apos; and switch up your exercises often to &apos;confuse the muscle&apos;."
                        delay={30}
                        className="text-slate-700 dark:text-slate-300"
                      />
                    </ClientOnly>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span className="line-through">&quot;Muscle confusion&quot;</span>
                </div>
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span className="line-through">&quot;Feel the burn&quot;</span>
                </div>
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span>Vague & Outdated Advice</span>
                </div>
              </div>
            </motion.div>

            {/* HypertroQ Side */}
            <motion.div 
              className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                  <Image src="/logo.png" alt="HypertroQ" width={24} height={24} className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">HypertroQ Coach</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Question: &quot;How many reps for muscle growth?&quot;</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-4 min-h-[120px]">
                  {showHypertroQAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text="For hypertrophy, the optimal range is typically 5-10 reps taken to 0-2 RIR (Reps in Reserve). This maximizes mechanical tension, which is the primary driver of muscle growth."
                        delay={25}
                        className="text-slate-700 dark:text-slate-300"
                        highlightTerms={['5-10 reps', 'RIR', 'mechanical tension']}
                      />
                    </ClientOnly>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Mechanical Tension</span>
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>RIR (Reps in Reserve)</span>
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Precise & Scientific Guidance</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section with Connecting Animation */}
      <section className="py-20 px-4 bg-muted/30 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple. Scientific. Personalized.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <ClientOnly>
              <ConnectingPath />
            </ClientOnly>
            
            {/* Step 1 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Upload className="w-10 h-10 text-white" />
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Knowledge Base</h3>
              <p className="text-muted-foreground">
                Access carefully curated research papers and training protocols vetted by fitness experts. Get evidence-based answers.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with Your Coach</h3>
              <p className="text-muted-foreground">
                Get instant, evidence-based answers from our expert-curated knowledge base. No generic advice.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TrendingUp className="w-10 h-10 text-white" />
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Achieve Your Goals</h3>
              <p className="text-muted-foreground">
                Apply evidence-based plans and track your progress with scientific precision.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HypertroQ?</h2>
            <p className="text-xl text-muted-foreground">Your complete fitness transformation toolkit</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <ClientOnly fallback={
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Your Perfect Plan, Instantly</h3>
                      <p className="text-muted-foreground">AI-powered workout routines tailored to your exact goals, experience level, and preferences.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading interactive features...</p>
                </div>
              </div>
            }>
              <InteractiveFeatureShowcase />
            </ClientOnly>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Final CTA Section */}
      <motion.section 
        className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full"
          animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Ready to Stop Guessing and Start Growing?
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl mb-8 opacity-90"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Get access to your science-backed fitness coaching platform today.
          </motion.p>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <PulsatingButton 
              className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-4 rounded-2xl font-bold"
              pulseColor="255, 255, 255"
            >
              <Link href="/signup">Get Started Free</Link>
            </PulsatingButton>
          </motion.div>
          <motion.p 
            className="text-sm mt-4 opacity-75"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            No credit card required • Start in 30 seconds
          </motion.p>
        </div>
      </motion.section>
    </div>
  );
}
