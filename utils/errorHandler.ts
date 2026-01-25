/**
 * Centralized error handling utility
 * Provides user-friendly error messages in Uzbek
 */

export interface ApiError {
  status?: number;
  message?: string;
  detail?: string;
  error?: string;
  error_note?: string;
  non_field_errors?: string[];
  [key: string]: any;
}

/**
 * Extract user-friendly error message from API error
 */
export function getErrorMessage(error: any): string {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Handle API error response
  if (error?.response) {
    const apiError: ApiError = error.response;
    
    // Check for non_field_errors first
    if (apiError.non_field_errors && Array.isArray(apiError.non_field_errors) && apiError.non_field_errors.length > 0) {
      return apiError.non_field_errors[0];
    }
    
    // Check for detail
    if (apiError.detail) {
      return typeof apiError.detail === 'string' ? apiError.detail : JSON.stringify(apiError.detail);
    }
    
    // Check for error_note (Click payment errors)
    if (apiError.error_note) {
      return apiError.error_note;
    }
    
    // Check for error
    if (apiError.error) {
      return typeof apiError.error === 'string' ? apiError.error : JSON.stringify(apiError.error);
    }
    
    // Check for message
    if (apiError.message) {
      return apiError.message;
    }
  }
  
  // Handle error object directly
  if (error?.detail) {
    return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
  }
  
  if (error?.error_note) {
    return error.error_note;
  }
  
  if (error?.error) {
    return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  }
  
  if (error?.message) {
    return error.message;
  }
  
  // Default error message
  return 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.';
}

/**
 * Get error message for specific field
 */
export function getFieldError(error: any, fieldName: string): string | null {
  if (error?.response?.[fieldName]) {
    const fieldError = error.response[fieldName];
    if (Array.isArray(fieldError) && fieldError.length > 0) {
      return fieldError[0];
    }
    return typeof fieldError === 'string' ? fieldError : null;
  }
  
  if (error?.[fieldName]) {
    const fieldError = error[fieldName];
    if (Array.isArray(fieldError) && fieldError.length > 0) {
      return fieldError[0];
    }
    return typeof fieldError === 'string' ? fieldError : null;
  }
  
  return null;
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: any): boolean {
  return error?.message?.includes('Network') || 
         error?.message?.includes('Failed to fetch') ||
         error?.code === 'NETWORK_ERROR';
}

/**
 * Check if error is authentication error
 */
export function isAuthError(error: any): boolean {
  return error?.status === 401 || 
         error?.response?.status === 401 ||
         error?.message?.includes('Unauthorized') ||
         error?.message?.includes('authentication');
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyError(error: any): string {
  if (isNetworkError(error)) {
    return 'Internet aloqasi yo\'q. Iltimos, internet aloqasini tekshiring.';
  }
  
  if (isAuthError(error)) {
    return 'Sizning sessiyangiz muddati tugagan. Iltimos, qayta kiring.';
  }
  
  if (error?.status === 403) {
    return 'Siz bu amalni bajarish huquqiga egasiz.';
  }
  
  if (error?.status === 404) {
    return 'Ma\'lumot topilmadi.';
  }
  
  if (error?.status === 500) {
    return 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.';
  }
  
  return getErrorMessage(error);
}
