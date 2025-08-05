'use client';

import { useTranslations, useLocale } from 'next-intl';
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
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [showGenericAnswer, setShowGenericAnswer] = useState(false);
  const [showHypertroQAnswer, setShowHypertroQAnswer] = useState(false);
  const trustBarRef = useRef(null);
  const isTrustBarInView = useInView(trustBarRef, { once: true, margin: "-50px" });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
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
          
          {/* Main Title */}
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <LineShadowText shadowColor="rgb(59, 130, 246)" className="text-4xl md:text-6xl lg:text-7xl">
              {t('hero.mainTitle')}
            </LineShadowText>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('hero.mainSubtitle')}
            <br />
            <span className="text-base md:text-lg">{t('hero.mainDescription')}</span>
          </motion.p>
          
          {/* Scientific Differentiator Highlight */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
              <X className="w-4 h-4" />
              {t('hero.traditionalPrograms')}
            </div>
            <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-green-500 rounded-full" />
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
              <Check className="w-4 h-4" />
              {t('hero.optimizedProtocols')}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {user ? (
              <div className="animate-fade-in flex justify-center">
                <PulsatingButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold">
                  <Link href={`/${locale}/chat`}>{t('hero.goToChat')}</Link>
                </PulsatingButton>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                <PulsatingButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold w-full sm:w-auto">
                  <Link href={`/${locale}/signup`}>{t('hero.getStartedFree')}</Link>
                </PulsatingButton>
                <Button asChild variant="outline" size="lg" className="text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 rounded-xl border-2 hover:bg-muted/50 w-full sm:w-auto">
                  <Link href="#comparison-section">{t('hero.seeDemo')}</Link>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Chat Demo */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('chatDemo.title')}</h3>
              </div>
              
              <div className="space-y-4">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                    <p className="text-sm">{t('chatDemo.userQuestion')}</p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Image src="/logo.png" alt="HypertroQ" width={20} height={20} className="w-5 h-5" />
                  </div>
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">{t('chatDemo.aiName')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('chatDemo.aiResponse')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
        <div className="max-w-4xl mx-auto text-center px-4">
          <p className="text-base md:text-lg font-medium text-muted-foreground">
            <span className="text-primary font-semibold">{t('trustBar.scienceBased')}</span> {t('trustBar.description')}
          </p>
        </div>
      </motion.section>

      {/* Comparison Section */}
      <section id="comparison-section" className="py-20 px-4 bg-muted/30 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent dark:from-red-400 dark:to-green-400">
                {t('comparison.title')}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">{t('comparison.subtitle')}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Generic AI Card */}
            <motion.div 
              className="bg-red-50 dark:bg-red-950/30 rounded-3xl p-6 md:p-8 border-2 border-red-200 dark:border-red-500/30 shadow-xl"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mr-3 md:mr-4">
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-red-700 dark:text-red-400">{t('comparison.genericAI')}</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 md:p-4 mb-4">
                  <p className="font-semibold text-sm md:text-base text-slate-600 dark:text-gray-300">{t('comparison.questionLabel')}: &quot;{t('comparison.question')}&quot;</p>
                </div>
                <div className="bg-red-100 dark:bg-red-950/30 rounded-lg p-3 md:p-4 min-h-[120px] md:min-h-[140px]">
                  {showGenericAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text={t('comparison.genericResponse')}
                        delay={25}
                        className="text-sm md:text-base text-slate-700 dark:text-gray-300"
                        highlightTerms={['8-12 reps', 'feel the burn', 'confuse the muscle']}
                      />
                    </ClientOnly>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <X className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.genericCons.outdated')}</span>
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <X className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.genericCons.myths')}</span>
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <X className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.genericCons.generic')}</span>
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <X className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.genericCons.noPersonalization')}</span>
                </div>
              </div>
            </motion.div>

            {/* HypertroQ Card */}
            <motion.div 
              className="bg-green-50 dark:bg-green-950/30 rounded-3xl p-6 md:p-8 border-2 border-green-200 dark:border-green-500/30 shadow-xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mr-3 md:mr-4">
                  <Image src="/logo.png" alt="HypertroQ" width={24} height={24} className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-400">HypertroQ</h3>
              </div>
              
              <div className="mb-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 md:p-4 mb-4">
                  <p className="font-semibold text-sm md:text-base text-slate-600 dark:text-gray-300">{t('comparison.questionLabel')}: &quot;{t('comparison.question')}&quot;</p>
                </div>
                <div className="bg-green-100 dark:bg-green-950/30 rounded-lg p-3 md:p-4 min-h-[120px] md:min-h-[140px]">
                  {showHypertroQAnswer && (
                    <ClientOnly>
                      <Typewriter
                        text={t('comparison.hypertroqResponse')}
                        delay={25}
                        className="text-sm md:text-base text-slate-700 dark:text-gray-300"
                        highlightTerms={['5-10 reps', 'RIR', 'mechanical tension', 'progressive overload']}
                      />
                    </ClientOnly>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.hypertroqPros.research')}</span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.hypertroqPros.evidenceBased')}</span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.hypertroqPros.personalized')}</span>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm md:text-base">{t('comparison.hypertroqPros.memory')}</span>
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
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 relative z-10">
              <LineShadowText shadowColor="rgb(99, 102, 241)" className="text-3xl md:text-4xl lg:text-5xl">
                {t('science.title')}
              </LineShadowText>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground relative z-10">{t('science.subtitle')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
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
                className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-2xl md:text-3xl relative z-10">🧬</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {t('features.latestResearch.title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  {t('features.latestResearch.description')}
                </p>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-blue-200/0 group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50 transition-all duration-300" />
            </motion.div>

            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
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
                className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-2xl md:text-3xl relative z-10">🔬</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {t('features.mythFreeTraining.title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  {t('features.mythFreeTraining.description')}
                </p>
              </div>
              
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-3xl border border-purple-200/0 group-hover:border-purple-200/50 dark:group-hover:border-purple-800/50 transition-all duration-300" />
            </motion.div>

            <motion.div 
              className="group relative bg-white dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm md:col-span-2 lg:col-span-1"
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
                className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="text-2xl md:text-3xl relative z-10">📊</span>
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  {t('features.optimizedProgramming.title')}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  {t('features.optimizedProgramming.description')}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howToUse.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('howToUse.subtitle')}</p>
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
              <h3 className="text-xl font-semibold mb-2">{t('howToUse.steps.createAccount.title')}</h3>
              <p className="text-muted-foreground">
                {t('howToUse.steps.createAccount.description')}
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
              <h3 className="text-xl font-semibold mb-2">{t('howToUse.steps.completeProfile.title')}</h3>
              <p className="text-muted-foreground">
                {t('howToUse.steps.completeProfile.description')}
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
              <h3 className="text-xl font-semibold mb-2">{t('howToUse.steps.startChatting.title')}</h3>
              <p className="text-muted-foreground">
                {t('howToUse.steps.startChatting.description')}
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
              <h3 className="text-xl font-semibold mb-2">{t('howToUse.steps.upgradeForMore.title')}</h3>
              <p className="text-muted-foreground">
                {t('howToUse.steps.upgradeForMore.description')}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('whyChoose.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('whyChoose.subtitle')}</p>
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
                  <h3 className="text-xl font-semibold mb-2">{t('whyChoose.benefits.personalTrainer.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.benefits.personalTrainer.description')}</p>
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
                  <h3 className="text-xl font-semibold mb-2">{t('whyChoose.benefits.personalizedProgramming.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.benefits.personalizedProgramming.description')}</p>
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
                  <h3 className="text-xl font-semibold mb-2">{t('whyChoose.benefits.evidenceBased.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.benefits.evidenceBased.description')}</p>
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
                  <h3 className="text-xl font-semibold mb-2">{t('whyChoose.benefits.continuousLearning.title')}</h3>
                  <p className="text-muted-foreground">{t('whyChoose.benefits.continuousLearning.description')}</p>
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
                    {t('whyChoose.specialFeatures.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground/80">{t('whyChoose.specialFeatures.subtitle')}</p>
                </div>
                
                <div className="space-y-5">
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover:item:shadow-lg group-hover:item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover:item:text-green-600 dark:group-hover:item:text-green-400 transition-colors duration-300">
                      {t('whyChoose.specialFeatures.fitness')}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover:item:shadow-lg group-hover:item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover:item:text-green-600 dark:group-hover:item:text-green-400 transition-colors duration-300">
                      {t('whyChoose.specialFeatures.myths')}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover:item:shadow-lg group-hover:item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover:item:text-green-600 dark:group-hover:item:text-green-400 transition-colors duration-300">
                      {t('whyChoose.specialFeatures.personalized')}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-4 group/item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-md group-hover:item:shadow-lg group-hover:item:scale-110 transition-all duration-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium group-hover:item:text-green-600 dark:group-hover:item:text-green-400 transition-colors duration-300">
                      {t('whyChoose.specialFeatures.programs')}
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
            className="text-3xl md:text-5xl font-bold mb-6 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('finalCta.title')}
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl mb-8 opacity-90 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('finalCta.subtitle')}
            <br />
            <span className="text-lg">{t('finalCta.freeMessages')}</span>
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
              <Link href={`/${locale}/signup`}>{t('finalCta.getStartedFree')}</Link>
            </PulsatingButton>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="text-primary border-primary hover:bg-primary/10 dark:text-white dark:border-white dark:hover:bg-white/10 text-lg px-8 py-3 rounded-xl"
            >
              <Link href={`/${locale}/pricing`}>{t('finalCta.viewPricing')}</Link>
            </Button>
          </motion.div>
          <motion.p 
            className="text-sm mt-4 opacity-75"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {t('finalCta.instantAccess')}
          </motion.p>
        </div>
      </motion.section>
    </main>
    </>
  );
}
