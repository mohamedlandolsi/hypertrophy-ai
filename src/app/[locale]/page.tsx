'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRef } from "react";
import { Check, X, ArrowRight, Zap, Target, Users, Shield, Star, ChevronDown } from "lucide-react";
import { motion, useInView } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const t = useTranslations('NewHomePage');
  const locale = useLocale();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  return (
    <main className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 px-4 py-20 md:py-32 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-200/20 dark:bg-grid-slate-700/20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                  <Shield className="w-4 h-4" />
                  {t('hero.trustBadges.scienceBased')}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                  <Target className="w-4 h-4" />
                  {t('hero.trustBadges.fullyCustomizable')}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                  <Zap className="w-4 h-4" />
                  {t('hero.trustBadges.mobileWebAccess')}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('hero.headline')}
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                {t('hero.subheadline')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Link href={`/${locale}/programs`} className="flex items-center gap-2">
                      {t('hero.cta.primary')}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </motion.div>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  <Link href="#how-it-works">
                    {t('hero.cta.secondary')}
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>{t('hero.socialProof.workoutsLogged')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span>{t('hero.socialProof.rating')}</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
                {/* Mockup placeholder - replace with actual screenshot */}
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <Target className="w-10 h-10 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                      {t('hero.mockup.title')}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {t('hero.mockup.placeholder')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Floating indicators */}
              <div className="absolute -left-6 top-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                ✓ {t('hero.indicators.volumeOptimal')}
              </div>
              <div className="absolute -right-6 bottom-20 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                {t('hero.indicators.exercisesSelected')}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('problemSolution.title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              {t('problemSolution.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Problem 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800"
            >
              <X className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-200">
                {t('problemSolution.problems.generic.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {t('problemSolution.problems.generic.description')}
              </p>
              <div className="pt-4 border-t border-red-200 dark:border-red-800">
                <Check className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  {t('problemSolution.problems.generic.solution')}
                </p>
              </div>
            </motion.div>

            {/* Problem 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800"
            >
              <X className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-200">
                {t('problemSolution.problems.volume.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {t('problemSolution.problems.volume.description')}
              </p>
              <div className="pt-4 border-t border-red-200 dark:border-red-800">
                <Check className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  {t('problemSolution.problems.volume.solution')}
                </p>
              </div>
            </motion.div>

            {/* Problem 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800"
            >
              <X className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3 text-red-900 dark:text-red-200">
                {t('problemSolution.problems.myths.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {t('problemSolution.problems.myths.description')}
              </p>
              <div className="pt-4 border-t border-red-200 dark:border-red-800">
                <Check className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  {t('problemSolution.problems.myths.solution')}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              {t('howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-20 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 dark:from-blue-800 dark:via-purple-800 dark:to-green-800"></div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative text-center"
            >
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl relative z-10">
                <span className="text-6xl">📚</span>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('howItWorks.steps.choose.title')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('howItWorks.steps.choose.description')}
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative text-center"
            >
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl relative z-10">
                <span className="text-6xl">⚙️</span>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('howItWorks.steps.customize.title')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('howItWorks.steps.customize.description')}
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative text-center"
            >
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl relative z-10">
                <span className="text-6xl">🤖</span>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('howItWorks.steps.guidance.title')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('howItWorks.steps.guidance.description')}
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative text-center"
            >
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl relative z-10">
                <span className="text-6xl">📱</span>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-20">
                4
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('howItWorks.steps.track.title')}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {t('howItWorks.steps.track.description')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-24">
            {/* Feature 1 - Program Builder */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-4">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">{t('features.programBuilder.badge')}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('features.programBuilder.title')}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                  {t('features.programBuilder.description')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.programBuilder.benefits.science.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.programBuilder.benefits.flexible.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.programBuilder.benefits.progressive.description')}</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-300">{t('features.programBuilder.screenshot')}</p>
                </div>
              </motion.div>
            </div>

            {/* Feature 2 - Exercise Database */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-xl shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-300">{t('features.exerciseDatabase.screenshot')}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full mb-4">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">{t('features.exerciseDatabase.badge')}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('features.exerciseDatabase.title')}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                  {t('features.exerciseDatabase.description')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.exerciseDatabase.benefits.comprehensive.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.exerciseDatabase.benefits.equipment.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.exerciseDatabase.benefits.smart.description')}</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Feature 3 - AI Assistant */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full mb-4">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">{t('features.aiAssistant.badge')}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('features.aiAssistant.title')}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                  {t('features.aiAssistant.description')}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.aiAssistant.benefits.instant.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.aiAssistant.benefits.evidence.description')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('features.aiAssistant.benefits.context.description')}</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-xl shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-300">{t('features.aiAssistant.screenshot')}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Individual Programs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-slate-200 dark:border-slate-700 shadow-xl"
            >
              <h3 className="text-2xl font-bold mb-2">{t('pricing.individual.title')}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{t('pricing.individual.price')}</span>
                <span className="text-slate-600 dark:text-slate-300 ml-2">{t('pricing.individual.period')}</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.individual.features.programs')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.individual.features.exercises')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.individual.features.basics')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.individual.features.support')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.individual.features.mobile')}</span>
                </li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href={`/${locale}/programs`}>{t('pricing.individual.cta')}</Link>
              </Button>
            </motion.div>

            {/* Pro Subscription */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                {t('pricing.pro.badge')}
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('pricing.pro.title')}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{t('pricing.pro.price')}</span>
                <span className="text-blue-100 ml-2">{t('pricing.pro.period')}</span>
                <p className="text-sm text-blue-100 mt-1">{t('pricing.pro.yearly')}</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.unlimited')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.custom')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.ai')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.advanced')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.priority')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>{t('pricing.pro.features.export')}</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-white text-blue-600 hover:bg-slate-100" size="lg">
                <Link href={`/${locale}/pricing`}>{t('pricing.pro.cta')}</Link>
              </Button>
              <p className="text-center text-sm text-blue-100 mt-4">
                {t('pricing.pro.guarantee')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              {t('faq.subtitle')}
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.trainer.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.trainer.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.customize.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.customize.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.exercises.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.exercises.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.ai.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.ai.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.switch.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.switch.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.mobile.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.mobile.answer')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-slate-200 dark:border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {t('faq.questions.afterPurchase.question')}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-300">
                {t('faq.questions.afterPurchase.answer')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('finalCta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-10 py-6">
                <Link href={`/${locale}/programs`}>
                  {t('finalCta.cta.primary')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-10 py-6">
                <Link href={`/${locale}/pricing`}>{t('finalCta.cta.secondary')}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('finalCta.guarantees.moneyBack')}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('finalCta.guarantees.lifetime')}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('finalCta.guarantees.cancel')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
