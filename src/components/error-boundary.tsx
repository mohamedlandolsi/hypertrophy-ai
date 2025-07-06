"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { logger } from "@/lib/error-handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to our centralized logger
    logger.error("React Error Boundary caught an error", error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to external error tracking service
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   });
    // }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent("Bug Report: Application Error");
    const body = encodeURIComponent(
      `I encountered an error while using the application.\n\n` +
      `Error: ${this.state.error?.message || "Unknown error"}\n` +
      `URL: ${window.location.href}\n` +
      `Time: ${new Date().toISOString()}\n` +
      `User Agent: ${navigator.userAgent}\n\n` +
      `Please describe what you were doing when this error occurred:`
    );
    
    window.open(`mailto:support@hypertroq.com?subject=${subject}&body=${body}`);
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We&apos;ve encountered an unexpected error. Don&apos;t worry, we&apos;ve been notified and are working to fix it.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-sm mb-2">Error Details (Development Mode)</h3>
                  <div className="text-xs space-y-1">
                    <p className="text-destructive font-mono break-all">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Stack Trace
                        </summary>
                        <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              <p>
                If this problem persists, please contact our support team at{" "}
                <a 
                  href="mailto:support@hypertroq.com" 
                  className="text-primary hover:underline"
                >
                  support@hypertroq.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling async errors in function components
export function useErrorHandler() {
  const [, setError] = React.useState<Error | null>(null);
  
  const handleError = React.useCallback((error: Error) => {
    logger.error("useErrorHandler caught an error", error, {
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // This will trigger the error boundary
    setError(() => {
      throw error;
    });
  }, []);
  
  return handleError;
}

// Utility function to create error boundary with specific fallback
export function createErrorBoundary(fallback: ReactNode) {
  return function CustomErrorBoundary({ children }: { children: ReactNode }) {
    return (
      <ErrorBoundary fallback={fallback}>
        {children}
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
