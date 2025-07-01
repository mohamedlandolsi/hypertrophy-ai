/**
 * Toast notification utilities
 * 
 * Provides consistent toast notifications throughout the application
 * using shadcn/ui's sonner component with predefined styles and behaviors.
 */

import { toast } from "sonner";

export const showToast = {
  /**
   * Show a success toast notification
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000, // Longer duration for errors
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Show a loading toast that can be updated later
   */
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    });
  },

  /**
   * Update a loading toast to success
   */
  updateToSuccess: (toastId: string | number, message: string, description?: string) => {
    toast.success(message, {
      id: toastId,
      description,
      duration: 4000,
    });
  },

  /**
   * Update a loading toast to error
   */
  updateToError: (toastId: string | number, message: string, description?: string) => {
    toast.error(message, {
      id: toastId,
      description,
      duration: 6000,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show upload progress toast
   */
  uploadProgress: (fileName: string, progress?: number) => {
    const progressText = progress !== undefined ? ` (${progress}%)` : '';
    return toast.loading(`Uploading ${fileName}${progressText}`, {
      description: 'Processing file and generating embeddings...',
    });
  },

  /**
   * Show processing status toast
   */
  processing: (message: string, details?: string) => {
    return toast.loading(message, {
      description: details,
    });
  },

  /**
   * Show upload success with details
   */
  uploadSuccess: (fileName: string, chunksCreated?: number, embeddingsGenerated?: number) => {
    const details = chunksCreated && embeddingsGenerated 
      ? `Created ${chunksCreated} chunks with ${embeddingsGenerated} embeddings`
      : undefined;
    
    toast.success(`Successfully uploaded ${fileName}`, {
      description: details,
      duration: 5000,
    });
  },

  /**
   * Show upload error with reason
   */
  uploadError: (fileName: string, reason: string) => {
    toast.error(`Failed to upload ${fileName}`, {
      description: reason,
      duration: 8000,
    });
  },

  /**
   * Show reprocessing results
   */
  reprocessingComplete: (successful: number, total: number) => {
    if (successful === total) {
      toast.success(`Successfully reprocessed ${successful} items`, {
        description: 'All files have been chunked and embedded',
        duration: 5000,
      });
    } else {
      toast.warning(`Reprocessed ${successful} out of ${total} items`, {
        description: `${total - successful} items had issues and may need attention`,
        duration: 6000,
      });
    }
  },

  /**
   * Show authentication error
   */
  authError: (message?: string) => {
    toast.error('Authentication required', {
      description: message || 'Please log in to continue',
      duration: 5000,
    });
  },

  /**
   * Show network error
   */
  networkError: (operation?: string) => {
    const message = operation ? `Failed to ${operation}` : 'Network error';
    toast.error(message, {
      description: 'Please check your internet connection and try again',
      duration: 6000,
    });
  },

  /**
   * Show validation error
   */
  validationError: (field: string, message: string) => {
    toast.error(`Invalid ${field}`, {
      description: message,
      duration: 5000,
    });
  },

  /**
   * Show file validation error
   */
  fileValidationError: (fileName: string, reason: string) => {
    toast.error(`Cannot upload ${fileName}`, {
      description: reason,
      duration: 6000,
    });
  },
};

// Export individual functions for convenience
export const {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
} = showToast;
