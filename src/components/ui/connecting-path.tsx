'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ConnectingPath() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="hidden md:block absolute inset-0 pointer-events-none">
      {/* First connection path */}
      <svg 
        className="absolute left-1/3 top-1/2 transform -translate-y-1/2"
        width="200" 
        height="100" 
        viewBox="0 0 200 100"
      >
        <motion.path
          d="M 20 50 Q 100 20 180 50"
          stroke="url(#gradient1)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="10 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Second connection path */}
      <svg 
        className="absolute left-2/3 top-1/2 transform -translate-y-1/2"
        width="200" 
        height="100" 
        viewBox="0 0 200 100"
      >
        <motion.path
          d="M 20 50 Q 100 80 180 50"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="10 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated dots along the path */}
      {isInView && (
        <>
          <motion.div
            className="absolute w-2 h-2 bg-blue-500 rounded-full"
            style={{ left: '33%', top: '50%' }}
            animate={{
              x: [0, 100, 200],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 2,
              delay: 1,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 3
            }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-green-500 rounded-full"
            style={{ left: '66%', top: '50%' }}
            animate={{
              x: [0, 100, 200],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 2,
              delay: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 3
            }}
          />
        </>
      )}
    </div>
  );
}
