# 🛡️ Enhanced Error Handling System

## Overview

The Hypertrophy AI application now features a comprehensive, centralized error handling system that provides:

- **Structured Error Types**: Categorized errors for better handling
- **User-Friendly Messages**: Clear, actionable error messages for users
- **Comprehensive Logging**: Structured logging with context for debugging
- **Frontend Error Boundaries**: React error boundaries to catch and handle UI errors
- **API Error Consistency**: Standardized error responses across all API routes
- **Toast Notifications**: Enhanced toast system with error-specific messaging

## 🏗️ Architecture

### Backend Components

#### 1. Error Handler Library (`src/lib/error-handler.ts`)

**Core Classes:**
- `AppError`: Base error class with structured properties
- `ValidationError`: For input validation errors
- `AuthenticationError`: For authentication failures
- `AuthorizationError`: For permission/authorization issues
- `NotFoundError`: For resource not found errors
- `FileUploadError`: For file upload specific errors
- `ExternalServiceError`: For third-party service failures

**Utilities:**
- `Logger`: Centralized logging with structured context
- `ApiErrorHandler`: Standardized API error handling and responses
- `Validators`: Common validation utilities

#### 2. Enhanced API Routes

All major API routes now use the centralized error handling:
- `/api/chat` - Chat API with message validation and error handling
- `/api/knowledge/upload` - File upload with comprehensive validation
- `/api/conversations` - Conversation management with proper error responses
- `/api/profile` - User profile with validation and error handling

### Frontend Components

#### 1. Error Boundary (`src/components/error-boundary.tsx`)

**Features:**
- Catches React component errors
- Logs errors with context
- Provides user-friendly fallback UI
- Offers recovery options (retry, reload, go home)
- Development mode with detailed error information

**Usage:**
```tsx
import ErrorBoundary from '@/components/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### 2. Enhanced Toast System (`src/lib/toast.ts`)

**New Methods:**
- `apiError()`: Handles structured API errors
- `retryPrompt()`: Shows retry option for failed operations
- `authError()`: Authentication-specific errors
- `networkError()`: Network connectivity issues
- `validationError()`: Input validation errors
- `fileValidationError()`: File upload validation errors

## 📋 Error Types

### Backend Error Categories

```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION',           // Invalid input data
  AUTHENTICATION = 'AUTHENTICATION',   // Authentication required
  AUTHORIZATION = 'AUTHORIZATION',     // Insufficient permissions
  NOT_FOUND = 'NOT_FOUND',            // Resource not found
  RATE_LIMIT = 'RATE_LIMIT',          // Too many requests
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // Third-party service issues
  DATABASE = 'DATABASE',               // Database errors
  FILE_UPLOAD = 'FILE_UPLOAD',        // File upload issues
  NETWORK = 'NETWORK',                // Network connectivity
  UNKNOWN = 'UNKNOWN'                 // Fallback for unexpected errors
}
```

### HTTP Status Code Mapping

- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization/permission errors
- **404 Not Found**: Resource not found
- **413 Payload Too Large**: File size exceeded
- **415 Unsupported Media Type**: Invalid file type
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Unexpected server errors
- **503 Service Unavailable**: External service errors

## 🔧 Implementation Examples

### Backend API Route

```typescript
import { ApiErrorHandler, ValidationError, logger } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);
  
  try {
    logger.info('API request received', context);
    
    const body = await request.json();
    
    // Validate required fields
    ApiErrorHandler.validateRequired(body, ['message']);
    
    // Custom validation
    if (body.message.length > 2000) {
      throw new ValidationError('Message is too long (maximum 2000 characters)', 'message');
    }
    
    // Process request...
    const result = await processRequest(body);
    
    logger.info('API request completed successfully', { ...context, resultId: result.id });
    
    return NextResponse.json(result);
    
  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}
```

### Frontend Error Handling

```typescript
const handleApiRequest = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    
    const result = await response.json();
    showToast.success('Operation completed successfully');
    
  } catch (error) {
    showToast.apiError('process request', error);
  }
};
```

### File Upload Validation

```typescript
// Backend validation
ApiErrorHandler.validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
});

// Frontend handling
try {
  // Upload logic
} catch (error) {
  if (error.type === 'FILE_UPLOAD') {
    showToast.fileValidationError(file.name, error.message);
  } else {
    showToast.apiError('upload file', error);
  }
}
```

## 🔍 Logging and Monitoring

### Structured Logging

All errors are logged with structured context:

```typescript
{
  timestamp: "2025-01-06T10:30:00.000Z",
  level: "ERROR",
  message: "API Error",
  error: {
    name: "ValidationError",
    message: "Message is required",
    type: "VALIDATION",
    statusCode: 400,
    userMessage: "Message is required and must be a non-empty string",
    context: { field: "message" }
  },
  endpoint: "/api/chat",
  method: "POST",
  userId: "user_123",
  requestId: "req_456"
}
```

### Development vs Production

- **Development**: Full error details, stack traces, and debug information
- **Production**: User-friendly messages only, detailed logging to external services

## 🎯 User Experience Improvements

### Before vs After

**Before:**
- Generic "Something went wrong" messages
- Console-only error logging
- Inconsistent error handling across components
- No error recovery options

**After:**
- Specific, actionable error messages
- Structured logging with context
- Consistent error handling patterns
- Error boundaries with recovery options
- Retry mechanisms for failed operations
- Network status awareness

### Toast Notification Examples

```typescript
// Authentication error
showToast.authError('Please log in to continue');

// File validation error
showToast.fileValidationError('document.pdf', 'File size exceeds 5MB limit');

// Network error with retry
showToast.retryPrompt('send message', () => handleRetry());

// API error with structured response
showToast.apiError('save profile', {
  type: 'VALIDATION',
  message: 'Invalid email format'
});
```

## 🔄 Error Recovery Patterns

### Automatic Retry

```typescript
const withRetry = async (operation: () => Promise<any>, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      if (error.type === 'NETWORK') {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        throw error; // Don't retry non-network errors
      }
    }
  }
};
```

### Fallback Strategies

```typescript
// Graceful degradation for optional features
try {
  const enhancedData = await fetchEnhancedData();
  return enhancedData;
} catch (error) {
  logger.warn('Enhanced data unavailable, using basic data', { error });
  return await fetchBasicData();
}
```

## 🚀 Future Enhancements

### Planned Integrations

1. **Sentry Integration**: Real-time error tracking and alerting
2. **Error Analytics**: Dashboard for error trends and patterns
3. **User Feedback**: Error reporting with user context
4. **Performance Monitoring**: Error impact on application performance

### Example Sentry Integration

```typescript
// TODO: Implement when Sentry is configured
import * as Sentry from "@sentry/nextjs";

export class Logger {
  public error(message: string, error?: Error, context?: LogContext): void {
    // Existing logging...
    
    if (process.env.SENTRY_DSN && error) {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          component: 'api',
          operation: context?.endpoint
        }
      });
    }
  }
}
```

## 📚 Best Practices

### Error Handling Guidelines

1. **Always use structured errors**: Use `AppError` subclasses instead of generic `Error`
2. **Provide context**: Include relevant information for debugging
3. **User-friendly messages**: Write clear, actionable error messages
4. **Log with context**: Include request details, user ID, and operation context
5. **Handle edge cases**: Consider network failures, rate limits, and service unavailability
6. **Test error scenarios**: Include error cases in unit and integration tests

### Security Considerations

- Never expose sensitive information in error messages
- Sanitize user input before logging
- Use generic messages for production while maintaining detailed logs
- Implement proper authentication checks before detailed error responses

## 🧪 Testing Error Scenarios

### Unit Tests

```typescript
describe('Error Handling', () => {
  it('should throw ValidationError for invalid input', () => {
    expect(() => {
      ApiErrorHandler.validateRequired({}, ['requiredField']);
    }).toThrow(ValidationError);
  });
  
  it('should handle file upload errors', () => {
    const oversizedFile = new File(['content'], 'test.txt', { 
      type: 'text/plain' 
    });
    Object.defineProperty(oversizedFile, 'size', { value: 10 * 1024 * 1024 });
    
    expect(() => {
      ApiErrorHandler.validateFile(oversizedFile, { maxSize: 5 * 1024 * 1024 });
    }).toThrow(FileUploadError);
  });
});
```

### Integration Tests

```typescript
describe('API Error Responses', () => {
  it('should return structured error for invalid request', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Missing required fields
    });
    
    expect(response.status).toBe(400);
    
    const error = await response.json();
    expect(error).toMatchObject({
      error: expect.any(String),
      type: 'VALIDATION'
    });
  });
});
```

This enhanced error handling system provides a robust foundation for maintaining application reliability, improving user experience, and facilitating effective debugging and monitoring.
