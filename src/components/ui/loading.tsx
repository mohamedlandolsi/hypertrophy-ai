import React from 'react';
import { Loader2, Zap, Dumbbell, Brain } from 'lucide-react';

interface LoadingProps {
  variant?: 'default' | 'pulse' | 'dots' | 'bars' | 'fitness' | 'brain';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  description?: string;
  className?: string;
}

export function Loading({ 
  variant = 'default', 
  size = 'md', 
  message, 
  description,
  className = '' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerSizeClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    const spinnerClass = `${sizeClasses[size]} ${className}`;
    
    switch (variant) {
      case 'pulse':
        return (
          <div className={`${spinnerClass} rounded-full bg-primary animate-pulse`} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} rounded-full bg-primary animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 bg-primary animate-pulse`}
                style={{ 
                  height: `${(i + 1) * 8}px`,
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      case 'fitness':
        return (
          <div className="relative">
            <div className={`${spinnerClass} border-2 border-primary/20 border-t-primary rounded-full animate-spin`} />
            <Dumbbell className="absolute inset-0 m-auto h-4 w-4 text-primary animate-pulse" />
          </div>
        );
      
      case 'brain':
        return (
          <div className="relative">
            <div className={`${spinnerClass} border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin`} />
            <Brain className="absolute inset-0 m-auto h-4 w-4 text-purple-500 animate-pulse" />
          </div>
        );
      
      default:
        return (
          <Loader2 className={`${spinnerClass} text-primary animate-spin`} />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${containerSizeClasses[size]}`}>
      {renderSpinner()}
      {message && (
        <p className={`font-medium text-foreground ${textSizeClasses[size]}`}>
          {message}
        </p>
      )}
      {description && (
        <p className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'} max-w-md`}>
          {description}
        </p>
      )}
    </div>
  );
}

// Specialized loading components for different contexts

export function PageLoading({ 
  message = "Loading...", 
  description,
  variant = 'default'
}: Partial<LoadingProps>) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <Loading 
        variant={variant}
        size="lg"
        message={message}
        description={description}
      />
    </div>
  );
}

export function FullPageLoading({ 
  message = "Loading...", 
  description,
  variant = 'default'
}: Partial<LoadingProps>) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="relative">
          {/* Animated background circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-primary/10 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-16 h-16 rounded-full border border-primary/30 animate-ping" style={{ animationDelay: '1s' }} />
          </div>
          
          <Loading 
            variant={variant}
            size="xl"
            message={message}
            description={description}
          />
        </div>
        
        {/* App branding */}
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Zap className="h-6 w-6" />
          <span className="text-lg font-semibold">HypertroQ</span>
        </div>
      </div>
    </div>
  );
}

export function InlineLoading({ 
  message, 
  size = 'sm',
  variant = 'default'
}: Partial<LoadingProps>) {
  return (
    <div className="flex items-center space-x-2">
      <Loading variant={variant} size={size} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

export function ButtonLoading({ 
  size = 'sm',
  className = ''
}: Partial<LoadingProps>) {
  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}

// Context-specific loading components

export function KnowledgeLoading() {
  return (
    <PageLoading 
      variant="brain"
      message="Processing Knowledge Base"
      description="Analyzing and organizing your fitness knowledge for optimal AI performance"
    />
  );
}

export function ChatLoading() {
  return (
    <InlineLoading 
      variant="dots"
      message="AI is thinking..."
    />
  );
}

export function FitnessLoading() {
  return (
    <PageLoading 
      variant="fitness"
      message="Analyzing Your Fitness Data"
      description="Processing your workout history and generating personalized recommendations"
    />
  );
}

export function AuthLoading() {
  return (
    <FullPageLoading 
      variant="pulse"
      message="Authenticating"
      description="Securely logging you into your fitness journey"
    />
  );
}

// Skeleton loading components

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
      <div className="h-3 bg-muted rounded w-2/3"></div>
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 animate-pulse">
          <div className="h-10 w-10 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-muted rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};
