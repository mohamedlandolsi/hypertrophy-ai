'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChartBar, Brain } from 'lucide-react';

interface FeatureShowcase {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  mockup: React.ReactNode;
}

const features: FeatureShowcase[] = [
  {
    id: 'plan',
    icon: Zap,
    title: 'Your Perfect Plan, Instantly',
    description: 'AI-powered workout routines tailored to your exact goals, experience level, and preferences.',
    mockup: (
      <div className="space-y-3">
        <motion.div 
          className="flex justify-between items-center p-3 bg-white/90 dark:bg-slate-800/90 rounded-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm font-medium">Generating your plan...</span>
          <motion.div 
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        <motion.div 
          className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-sm font-semibold mb-2">✨ Plan Ready!</div>
          <div className="text-xs space-y-1">
            <div>• Bench Press: 4x6-8 @RPE 8</div>
            <div>• Rows: 3x8-10 @RPE 7</div>
            <div>• Overhead Press: 3x6-8 @RPE 8</div>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 'progress',
    icon: ChartBar,
    title: 'Visualize Your Victories',
    description: 'Track every rep, set, and milestone with detailed analytics that show your transformation.',
    mockup: (
      <div className="space-y-3">
        <div className="text-sm font-medium mb-2">Strength Progress</div>
        <div className="space-y-2">
          {[
            { exercise: 'Bench Press', progress: 85 },
            { exercise: 'Squat', progress: 92 },
            { exercise: 'Deadlift', progress: 78 }
          ].map((item, index) => (
            <motion.div 
              key={item.exercise}
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="flex justify-between text-xs">
                <span>{item.exercise}</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'expert',
    icon: Brain,
    title: 'A Kinesiology Expert in Your Pocket',
    description: 'Real-time coaching powered by the latest exercise science research and your trusted sources.',
    mockup: (
      <div className="space-y-3">
        <motion.div 
          className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">💡 Real-time Tip</div>
          <div className="text-sm">Keep your core tight and maintain a neutral spine throughout the movement.</div>
        </motion.div>
        <motion.div 
          className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border-l-4 border-green-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">📚 Science-backed</div>
          <div className="text-sm">Based on Schoenfeld et al. (2017) - optimal volume for hypertrophy.</div>
        </motion.div>
      </div>
    )
  }
];

export default function InteractiveFeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Features List */}
      <div className="space-y-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isActive = activeFeature === feature.id;
          
          return (
            <motion.div 
              key={feature.id}
              className={`flex items-start space-x-4 group cursor-pointer p-4 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'hover:bg-muted/50'
              }`}
              onClick={() => setActiveFeature(feature.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-100 dark:bg-blue-900 group-hover:scale-110'
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Showcase Panel */}
      <motion.div 
        className="relative"
        layout
      >
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-2xl p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {features.find(f => f.id === activeFeature)?.mockup}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Floating decorative elements */}
        <motion.div 
          className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  );
}
