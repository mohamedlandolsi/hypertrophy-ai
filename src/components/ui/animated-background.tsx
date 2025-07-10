'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function AnimatedBackground() {
  // Generate deterministic particle positions to avoid hydration mismatch
  const particles = useMemo(() => {
    const particleArray = [];
    for (let i = 0; i < 20; i++) {
      // Use index-based deterministic positioning
      const angle = (i / 20) * 2 * Math.PI;
      const radius = 0.3 + (i % 5) * 0.15; // Vary radius based on index
      const left = 50 + Math.cos(angle) * radius * 50;
      const top = 50 + Math.sin(angle) * radius * 50;
      
      particleArray.push({
        id: i,
        left: Math.max(5, Math.min(95, left)), // Keep within bounds
        top: Math.max(5, Math.min(95, top)),
        duration: 10 + (i % 10),
        delay: i * 0.5
      });
    }
    return particleArray;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/30 to-blue-400/30 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -100, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        animate={{
          x: [-100, 100, -100],
          y: [-50, 50, -50],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating particles with deterministic positioning */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
