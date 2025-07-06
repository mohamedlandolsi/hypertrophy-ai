/**
 * Centralized Error Handling System
 * 
 * Provides consistent error handling, logging, and user-friendly error messages
 * across the entire application. Supports structured logging with Sentry integration.
 */

import { NextResponse } from 'next/server';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class for better error handling
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode: number = 500,
    userMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.context = context;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return 'The provided data is invalid. Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication required. Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorType.EXTERNAL_SERVICE:
        return 'An external service is temporarily unavailable. Please try again later.';
      case ErrorType.DATABASE:
        return 'A database error occurred. Please try again.';
      case ErrorType.FILE_UPLOAD:
        return 'File upload failed. Please check the file and try again.';
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.VALIDATION,
      400,
      field ? `Invalid ${field}: ${message}` : message,
      context
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, ErrorType.AUTHENTICATION, 401, undefined, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, ErrorType.AUTHORIZATION, 403, undefined, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      404,
      `The requested ${resource.toLowerCase()} was not found.`,
      context
    );
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorType.FILE_UPLOAD, 400, undefined, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(
      `${service} error: ${message}`,
      ErrorType.EXTERNAL_SERVICE,
      503,
      `${service} is temporarily unavailable. Please try again later.`,
      context
    );
  }
}

// Enhanced logging interface
interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

// Logger class with structured logging
export class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public error(message: string, error?: Error | AppError, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof AppError && {
            type: error.type,
            statusCode: error.statusCode,
            userMessage: error.userMessage,
            context: error.context,
            isOperational: error.isOperational
          })
        }
      }),
      ...context
    };

    // Console logging for development
    if (this.isDevelopment) {
      console.error('🚨 [ERROR]', logEntry);
    }

    // TODO: Integrate with external logging service (Sentry, LogRocket, etc.)
    // this.sendToExternalService(logEntry);
  }

  public warn(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'WARN',
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.warn('⚠️ [WARN]', logEntry);
    }
  }

  public info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'INFO',
      message,
      ...context
    };

    if (this.isDevelopment) {
      console.info('ℹ️ [INFO]', logEntry);
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: 'DEBUG',
        message,
        ...context
      };
      console.debug('🐛 [DEBUG]', logEntry);
    }
  }

  // TODO: Implement external service integration
  // private sendToExternalService(logEntry: any): void {
  //   if (process.env.SENTRY_DSN) {
  //     // Send to Sentry
  //   }
  // }
}

// Error handler for API routes
export class ApiErrorHandler {
  private static logger = Logger.getInstance();

  /**
   * Handle and format errors for API responses
   */
  public static handleError(error: unknown, context?: LogContext): NextResponse {
    // Log the error
    this.logger.error('API Error', error instanceof Error ? error : new Error(String(error)), context);

    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          error: error.userMessage,
          type: error.type,
          ...(process.env.NODE_ENV === 'development' && { 
            details: error.message,
            context: error.context 
          })
        },
        { status: error.statusCode }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      return this.handlePrismaError(error as { code: string; message?: string });
    }

    // Handle network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'Network error. Please check your connection and try again.',
          type: ErrorType.NETWORK
        },
        { status: 503 }
      );
    }

    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        type: ErrorType.UNKNOWN,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    );
  }

  /**
   * Handle Prisma-specific errors
   */
  private static handlePrismaError(error: { code: string; message?: string }): NextResponse {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { 
            error: 'A record with this information already exists.',
            type: ErrorType.VALIDATION
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          { 
            error: 'The requested record was not found.',
            type: ErrorType.NOT_FOUND
          },
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          { 
            error: 'Cannot delete this record because it is referenced by other records.',
            type: ErrorType.VALIDATION
          },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { 
            error: 'Database error. Please try again.',
            type: ErrorType.DATABASE
          },
          { status: 500 }
        );
    }
  }

  /**
   * Validate request body and throw validation errors
   */
  public static validateRequired(body: Record<string, unknown>, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !body[field]);
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        missing[0],
        { missingFields: missing, providedFields: Object.keys(body) }
      );
    }
  }

  /**
   * Validate file upload
   */
  public static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}): void {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options;

    if (!file) {
      throw new FileUploadError('No file provided');
    }

    if (file.size > maxSize) {
      throw new FileUploadError(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit`,
        { fileSize: file.size, maxSize, fileName: file.name }
      );
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new FileUploadError(
        `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
        { fileType: file.type, allowedTypes, fileName: file.name }
      );
    }
  }

  /**
   * Create request context from NextRequest
   */
  public static createContext(request: Request, additionalContext?: Record<string, unknown>): LogContext {
    const url = new URL(request.url);
    return {
      endpoint: url.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      requestId: request.headers.get('x-request-id') || undefined,
      ...additionalContext
    };
  }
}

// Validation utilities
export const Validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  number: (value: unknown, min?: number, max?: number): boolean => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },

  string: (value: unknown, minLength?: number, maxLength?: number): boolean => {
    if (typeof value !== 'string') return false;
    if (minLength !== undefined && value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
    return true;
  },

  array: (value: unknown, minItems?: number, maxItems?: number): boolean => {
    if (!Array.isArray(value)) return false;
    if (minItems !== undefined && value.length < minItems) return false;
    if (maxItems !== undefined && value.length > maxItems) return false;
    return true;
  }
};

// Export singleton logger instance
export const logger = Logger.getInstance();
