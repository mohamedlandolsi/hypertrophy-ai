'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function ComingSoon({
  title = "Coming Soon",
  subtitle = "Something amazing is on the way",
  description = "We're working hard to bring you an incredible experience. Stay tuned for updates!"
}: ComingSoonProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Title Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            {title}
          </h1>
          <h2 className="text-xl md:text-2xl text-muted-foreground font-medium">
            {subtitle}
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto"
        >
          {description}
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12"
        >
          <div className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
            <Calendar className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Launching Soon</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;re putting the finishing touches on something special
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
            <Clock className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Worth the Wait</h3>
            <p className="text-sm text-muted-foreground">
              The experience will exceed your expectations
            </p>
          </div>
        </motion.div>

        {/* Pulse Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex justify-center mt-12"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-3 h-3 bg-primary rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}

export default ComingSoon;
