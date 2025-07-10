'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';

interface InteractiveLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function InteractiveLogo({ 
  src, 
  alt, 
  width = 128, 
  height = 128, 
  className = '' 
}: InteractiveLogoProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / rect.width;
    const deltaY = (e.clientY - centerY) / rect.height;
    
    setMousePosition({ x: deltaX * 15, y: deltaY * 15 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        animate={{
          rotateX: mousePosition.y,
          rotateY: mousePosition.x,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Image 
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-contain drop-shadow-2xl"
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Enhanced orbiting elements */}
      <motion.div 
        className="absolute -inset-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <motion.div 
          className="absolute top-0 left-1/2 w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transform -translate-x-1/2 shadow-lg"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-1/2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform -translate-x-1/2 shadow-lg"
          animate={{ scale: [1.5, 1, 1.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute left-0 top-1/2 w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform -translate-y-1/2 shadow-lg"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute right-0 top-1/2 w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transform -translate-y-1/2 shadow-lg"
          animate={{ scale: [1.5, 1, 1.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </motion.div>
    </motion.div>
  );
}
