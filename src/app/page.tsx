'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import PulsatingButton from "@/components/magicui/pulsating-button";
import LineShadowText from "@/components/magicui/line-shadow-text";
import { Check, X, MessageSquare } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBackground from "@/components/ui/animated-background";
import InteractiveLogo from "@/components/ui/interactive-logo";
import Typewriter from "@/components/ui/typewriter";
import ConnectingPath from "@/components/ui/connecting-path";
import ClientOnly from "@/components/ui/client-only";
import Head from "next/head";
import { generateSchema } from "@/lib/seo";

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
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              generateSchema('WebSite'),
              generateSchema('Organization'),
              generateSchema('Product')
            ])
          }}
        />
      </Head>
      
      <main className="flex flex-col min-h-screen">
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
                    alt="HypertroQ - AI-Powered Personal Fitness Coach Logo"
                    width={128}
                    height={128}
                    className="h-24 w-24 md:h-32 md:w-32 object-contain"
                    priority
                  />
                </div>
              }>
                <InteractiveLogo 
                  src="/logo.png"
                  alt="HypertroQ - AI-Powered Personal Fitness Coach Logo"
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
                  Meet HypertroQ
                </LineShadowText>
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Your <span className="text-primary font-semibold">Evidence-Based AI Fitness Coach</span> powered by cutting-edge exercise science research.
                <br />
                <span className="text-lg">Unlike generic AI assistants, HypertroQ eliminates fitness myths and outdated methods with science-backed training philosophy.</span>
              </motion.p>
              
              {/* Scientific Differentiator Highlight */}
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Traditional 4×12 programs</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Optimized, science-based protocols</span>
                </div>
              </motion.div>
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
            <span className="text-primary font-semibold">Built on Modern Exercise Science:</span> Updated with cutting-edge studies in physiology, biomechanics, kinesiology, and nutrition science.
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
                Why HypertroQ vs Generic AI?
              </LineShadowText>
            </h2>
            <p className="text-xl text-muted-foreground">The difference is in the science, not the hype.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Generic AI Side */}
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
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">Generic AI (ChatGPT, Gemini)</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Question: &quot;How many reps for muscle growth?&quot;</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-4 min-h-[140px]">
                  {showGenericAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text="A good rep range for building muscle is typically 8-12 reps. You need to really 'feel the burn' and switch up your exercises often to 'confuse the muscle'. Also, make sure to do lots of isolation work."
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
                  <span>Outdated fitness information</span>
                </div>
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span>Perpetuates training myths</span>
                </div>
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span>Generic, one-size-fits-all advice</span>
                </div>
                <div className="flex items-center text-red-600">
                  <X className="w-5 h-5 mr-2" />
                  <span>No personalization or memory</span>
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
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">HypertroQ</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Question: &quot;How many reps for muscle growth?&quot;</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-4 min-h-[140px]">
                  {showHypertroQAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text="For hypertrophy, the optimal range is typically 5-10 reps taken to 0-2 RIR (Reps in Reserve). This maximizes mechanical tension, which is the primary driver of muscle growth. Based on your profile, I'd recommend compound movements with progressive overload."
                        delay={25}
                        className="text-slate-700 dark:text-slate-300"
                        highlightTerms={['5-10 reps', 'RIR', 'mechanical tension', 'progressive overload']}
                      />
                    </ClientOnly>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Latest exercise science research</span>
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Evidence-based, myth-free guidance</span>
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Personalized to your profile</span>
                </div>
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-5 mr-2" />
                  <span>Remembers your progress & preferences</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scientific Credibility Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-indigo-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <LineShadowText shadowColor="rgb(99, 102, 241)" className="text-4xl md:text-5xl">
                Built on Modern Exercise Science
              </LineShadowText>
            </h2>
            <p className="text-xl text-muted-foreground">Your pocket personal trainer with expertise in all fitness-related fields</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-blue-50/50 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-blue-950/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Animated icon container */}
              <motion.div 
                className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-3xl relative z-10">🧬</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  Latest Research Integration
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  Updated with cutting-edge studies in physiology, biomechanics, and kinesiology. No outdated information from generic LLMs.
                </p>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-blue-200/0 group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-all duration-300" />
            </motion.div>

            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-purple-100/30 to-purple-50/50 dark:from-purple-950/20 dark:via-purple-900/10 dark:to-purple-950/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Animated icon container */}
              <motion.div 
                className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-3xl relative z-10">🔬</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  Myth-Free Training
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  Eliminates common misconceptions like muscle damage being primary for hypertrophy. Evidence-based, not tradition-based.
                </p>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-purple-200/0 group-hover:border-purple-200/50 dark:group-hover:border-purple-800/50 transition-all duration-300" />
            </motion.div>

            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-green-100/30 to-green-50/50 dark:from-green-950/20 dark:via-green-900/10 dark:to-green-950/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Animated icon container */}
              <motion.div 
                className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-3xl relative z-10">📊</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  Optimized Programming
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  Science-based exercise selection and programming beyond traditional cookie-cutter 4×12 routines.
                </p>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-green-200/0 group-hover:border-green-200/50 dark:group-hover:border-green-800/50 transition-all duration-300" />
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How to Use HypertroQ</h2>
            <p className="text-xl text-muted-foreground">Simple. Scientific. Personalized.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
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
                  <span className="text-2xl">👤</span>
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up with email or Google for instant access to your AI fitness coach.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl">📋</span>
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-muted-foreground">
                Add your training history, goals, and preferences for personalized coaching (optional but recommended).
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl">💬</span>
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Chatting</h3>
              <p className="text-muted-foreground">
                Ask questions, get programs, receive evidence-based guidance tailored to you.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
              className="text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="relative mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl">🚀</span>
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upgrade for More</h3>
              <p className="text-muted-foreground">
                Subscribe to Pro for unlimited coaching and full conversation memory.
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
            <p className="text-xl text-muted-foreground">Your pocket personal trainer with expertise in all fitness-related fields</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧬</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Pocket Personal Trainer</h3>
                  <p className="text-muted-foreground">Available 24/7 with deep knowledge of physiology, biomechanics, kinesiology, and nutrition science.</p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personalized Programming</h3>
                  <p className="text-muted-foreground">Knows everything about you to create customized training programs that fit your specific case.</p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔬</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Evidence-Based Philosophy</h3>
                  <p className="text-muted-foreground">Eliminates fitness myths with up-to-date research and optimized training methodologies.</p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Continuous Learning</h3>
                  <p className="text-muted-foreground">Remembers your progress, preferences, and adapts recommendations over time.</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="group relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900/80 rounded-3xl p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-green-50/30 dark:from-blue-950/10 dark:via-purple-950/5 dark:to-green-950/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-6">
                <div className="text-center">
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-2xl mb-4 shadow-lg"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  >
                    <span className="text-2xl text-white">✨</span>
                  </motion.div>
                  <h4 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                    What Makes HypertroQ Special
                  </h4>
                  <p className="text-sm text-muted-foreground/80">Unlike generic AI assistants</p>
                </div>
                
                <div className="space-y-5">
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover/item:shadow-lg group-hover/item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-300">
                      Specializes in fitness & training
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover/item:shadow-lg group-hover/item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-300">
                      Eliminates fitness myths
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover/item:shadow-lg group-hover/item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-300">
                      Personalized to your profile
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover/item:shadow-lg group-hover/item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-300">
                      Builds optimal programs
                    </span>
                  </motion.div>
                </div>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-blue-200/0 group-hover:border-blue-200/30 dark:group-hover:border-blue-800/30 transition-all duration-300" />
            </motion.div>
          </div>
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
            <br />
            <span className="text-lg">15 free messages to try HypertroQ - no credit card required</span>
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
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
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="text-white border-white hover:bg-white/10 text-lg px-8 py-3 rounded-xl"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </motion.div>
          <motion.p 
            className="text-sm mt-4 opacity-75"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Start chatting instantly • No credit card required • 15 free messages
          </motion.p>
        </div>
      </motion.section>
    </main>
    </>
  );
}
