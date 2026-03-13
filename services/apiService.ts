/**
 * API Service for Phoenix Scientific Platform
 * Handles all HTTP requests to the backend
 */

import { getUserFriendlyError, isAuthError } from '../utils/errorHandler';

// Production API URL - always use production URL in built version
// In development, use VITE_API_BASE_URL from .env, otherwise use production
// IMPORTANT: Production build'da har doim production URL ishlatiladi
const isProduction = import.meta.env.PROD || window.location.hostname === 'ilmiyfaoliyat.uz' || window.location.hostname === 'www.ilmiyfaoliyat.uz';

const API_BASE_URL = isProduction 
  ? 'https://api.ilmiyfaoliyat.uz/api/v1'
  : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1');

const MEDIA_URL = isProduction
  ? 'https://api.ilmiyfaoliyat.uz/media/'
  : (import.meta.env.VITE_MEDIA_URL || 'http://127.0.0.1:8000/media/');

// Debug: API URL only in development (production'da log chiqarilmaydi)
if (typeof window !== 'undefined' && !isProduction) {
  console.log(`[API] API_BASE_URL: ${API_BASE_URL}`);
}

// Get token from localStorage
const getToken = () => localStorage.getItem('access_token');

// Set token
const setToken = (token: string) => localStorage.setItem('access_token', token);

// Remove token
const removeToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/** Build user-visible message from API 400 body (detail string or DRF field errors object). */
function formatApiErrorMessage(error: Record<string, unknown>, status: number): string {
  const detail = error.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (typeof detail === 'object' && detail !== null) {
    const parts = Object.entries(detail as Record<string, unknown>).map(([k, v]) =>
      `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`
    );
    if (parts.length) return parts.join('; ');
  }
  // DRF returns { "field": ["msg"] } without "detail"
  const fieldParts = Object.entries(error)
    .filter(([k]) => k !== 'detail' && k !== 'message')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
  if (fieldParts.length) return fieldParts.join('; ');
  return (error.message as string) || `API request failed with status ${status}`;
}

// Base fetch with authentication
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});

  // Let browser set multipart boundary for FormData requests
  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    if (!isProduction) {
      console.log(`[API] Request: ${options.method || 'GET'} ${fullUrl}`);
    }
    const response = await fetch(fullUrl, config);

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      removeToken();
      const err: any = new Error('Sizning sessiyangiz muddati tugagan. Iltimos, qayta kiring.');
      err.status = 401;
      window.location.href = '/#/login';
      throw err;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let error: any;
      
      // Try to parse as JSON
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        // If not JSON, check if it's HTML (Django error page)
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          // Extract error message from HTML if possible
          const errorMatch = errorText.match(/<pre class="exception_value">(.*?)<\/pre>/s);
          if (errorMatch) {
            error = { detail: errorMatch[1].trim(), html: true };
          } else {
            error = { detail: `Server xatosi (Status: ${response.status})`, html: true };
          }
        } else {
          error = { detail: errorText || 'Noma\'lum xatolik' };
        }
      }
      
      // Use centralized error handler for user-friendly messages
      const errorMessage = getUserFriendlyError({ response: error, status: response.status });
      
      const apiError: any = new Error(errorMessage);
      apiError.status = response.status;
      apiError.response = error;
      throw apiError;
    }

    const text = await response.text();
    
    if (!text) {
      return {};
    }

    try {
      const data = JSON.parse(text);
      return data;
    } catch (e) {
      throw new Error('Invalid response format');
    }
  } catch (error: any) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const isSessionExpired = error?.status === 401 || error?.message?.includes('sessiya');
    const isForbiddenExpected = error?.status === 403 && (error?.message?.includes('huquq') || error?.message?.includes('egasiz'));
    if (!isProduction && !isSessionExpired && !isForbiddenExpected) {
      console.error(`[API] Request failed:`, fullUrl, error?.message || error);
    }
    
    // Network error handling - agar fetch xatolik bersa
    if (error?.name === 'TypeError' && (error?.message?.includes('fetch') || error?.message?.includes('Failed'))) {
      const networkError: any = new Error('Serverga ulanib bo\'lmadi.');
      networkError.name = 'NetworkError';
      networkError.code = 'NETWORK_ERROR';
      networkError.originalError = error;
      networkError.url = fullUrl;
      throw networkError;
    }
    
    // CORS error handling
    if (error?.message?.includes('CORS') || error?.message?.includes('cors')) {
      const corsError: any = new Error('Server CORS sozlamalari noto\'g\'ri. Iltimos, administratorga murojaat qiling.');
      corsError.name = 'CORS_ERROR';
      corsError.code = 'CORS_ERROR';
      throw corsError;
    }
    
    // Agar error allaqachon formatlangan bo'lsa, uni qaytarish
    throw error;
  }
};

// API Service
export const apiService = {
  // Authentication
  auth: {
    login: async (phone: string, password: string) => {
      const data = await apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      
      if (data.access) {
        setToken(data.access);
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return data;
    },

    register: async (userData: any) => {
      const data = await apiFetch('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (data.access) {
        setToken(data.access);
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return data;
    },

    logout: () => {
      removeToken();
    },

    getProfile: () => apiFetch('/auth/profile/'),

    /** Muallifning arxiv hujjatlari: maqolalar, UDK, sertifikatlar, taqriz natijalari. */
    getArchive: () => apiFetch('/auth/archive/'),

    updateProfile: (userData: any) =>
      apiFetch('/auth/update_profile/', {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),
      
    stats: () => apiFetch('/auth/stats/'),
  },

  // Users
  users: {
    list: () => apiFetch('/auth/'),

    get: (id: string) => apiFetch(`/auth/${id}/`),

    create: (userData: any) =>
      apiFetch('/auth/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    update: (id: string, userData: any) =>
      apiFetch(`/auth/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),

    delete: (id: string) =>
      apiFetch(`/auth/${id}/`, {
        method: 'DELETE',
      }),

    /** User activity, stats and history (super_admin only). */
    activity: (id: string) => apiFetch(`/auth/${id}/activity/`),
      
    stats: () => apiFetch('/auth/stats/'),
  },

  // Articles
  articles: {
    /** Maqola namuna: 1 bet narxlari (quyi/orta/yuqori). */
    getArticleSamplePrice: () => apiFetch('/articles/article-sample/price/'),
    /** Maqola namuna so'rovi yaratadi, tranzaksiya qaytaradi (to'lov sahifasiga yo'naltirish uchun). */
    createArticleSampleRequest: (data: {
      requirements: string;
      pages: number;
      topic: string;
      quality_level: 'quyi' | 'orta' | 'yuqori';
      first_name: string;
      last_name: string;
    }) =>
      apiFetch('/articles/article-sample/request/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch(`/articles/${query}`);
    },

    get: (id: string) => apiFetch(`/articles/${id}/`),

    getPublic: (id: string) => apiFetch(`/articles/public/${id}/`),

    create: async (articleData: any, files?: { mainFile?: File, additionalFile?: File }) => {
      if (files && (files.mainFile || files.additionalFile)) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all article data fields
        Object.keys(articleData).forEach(key => {
          const value = articleData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Handle arrays by stringifying them
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add files if provided
        if (files.mainFile) {
          formData.append('final_pdf_path', files.mainFile);
        }
        if (files.additionalFile) {
          formData.append('additional_document_path', files.additionalFile);
        }
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/articles/`, {
          method: 'POST',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          throw new Error(error.detail || error.message || `API request failed with status ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch('/articles/', {
          method: 'POST',
          body: JSON.stringify(articleData),
        });
      }
    },

    update: async (id: string, articleData: any, files?: { mainFile?: File, additionalFile?: File }) => {
      if (files && (files.mainFile || files.additionalFile)) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all article data fields
        Object.keys(articleData).forEach(key => {
          const value = articleData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Convert arrays to JSON strings
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add files if provided
        if (files.mainFile) {
          formData.append('final_pdf_path', files.mainFile);
        }
        if (files.additionalFile) {
          formData.append('additional_document_path', files.additionalFile);
        }
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/articles/${id}/`, {
          method: 'PUT',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          throw new Error(error.detail || error.message || `API request failed with status ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch(`/articles/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(articleData),
        });
      }
    },

    patch: (id: string, data: Partial<Record<string, unknown>>) =>
      apiFetch(`/articles/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch(`/articles/${id}/`, {
        method: 'DELETE',
      }),

    incrementViews: (id: string) =>
      apiFetch(`/articles/${id}/increment_views/`, {
        method: 'POST',
      }),

    incrementDownloads: (id: string) =>
      apiFetch(`/articles/${id}/increment_downloads/`, {
        method: 'POST',
      }),

    updateStatus: (id: string, status: string, reason?: string) =>
      apiFetch(`/articles/${id}/update_status/`, {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      }),

    checkPlagiarism: (id: string) =>
      apiFetch(`/articles/${id}/check_plagiarism/`, {
        method: 'POST',
      }),

    /** Nashr qilish: sertifikat yuklash, status Published, muallifga bildirishnoma */
    completePublication: (id: string, formData: FormData) =>
      fetch(`${API_BASE_URL}/articles/${id}/complete_publication/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      }).then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          let err: { error?: string; detail?: string } = {};
          try {
            err = JSON.parse(text);
          } catch {
            err = { detail: text };
          }
          throw Object.assign(
            new Error((err as any).error || (err as any).detail || 'Xatolik'),
            { status: r.status, response: err }
          );
        }
        return text ? JSON.parse(text) : {};
      }),
  },

  // DOI raqami olish
  doi: {
    price: () => apiFetch('/articles/doi/price/'),
    request: (formData: FormData) =>
      fetch(`${API_BASE_URL}/articles/doi/request/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      }).then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          let err: any;
          try {
            err = JSON.parse(text);
          } catch {
            err = { detail: text };
          }
          throw Object.assign(new Error(err.detail || 'Xatolik'), { status: r.status, response: err });
        }
        return text ? JSON.parse(text) : {};
      }),
    list: () => apiFetch('/articles/doi/requests/'),
    updateLink: (id: string, doi_link: string) =>
      apiFetch(`/articles/doi/requests/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ doi_link }),
      }),
  },

  /** Maqola namuna so'rovlari (taqrizchi: barcha, muallif: o'zini) */
  articleSample: {
    list: () => apiFetch('/articles/article-sample/requests/'),
  },

  // Journals
  journals: {
    listCategories: () => apiFetch('/journals/categories/'),
    
    list: () => apiFetch('/journals/journals/'),
    
    get: (id: string) => apiFetch(`/journals/journals/${id}/`),
    
    create: async (journalData: any, imageFile?: File) => {
      
      if (imageFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all journal data fields
        Object.keys(journalData).forEach(key => {
          const value = journalData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Convert arrays to JSON strings
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add the image file
        formData.append('image_url', imageFile);
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/journals/journals/`, {
          method: 'POST',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          throw new Error(error.detail || error.message || `API request failed with status ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch('/journals/journals/', {
          method: 'POST',
          body: JSON.stringify(journalData),
        });
      }
    },
    
    update: async (id: string, journalData: any, imageFile?: File) => {
      
      if (imageFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all journal data fields
        Object.keys(journalData).forEach(key => {
          const value = journalData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Convert arrays to JSON strings
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add the image file
        formData.append('image_url', imageFile);
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/journals/journals/${id}/`, {
          method: 'PUT',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          throw new Error(error.detail || error.message || `API request failed with status ${response.status}`);
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch(`/journals/journals/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(journalData),
        });
      }
    },
    
    delete: (id: string) =>
      apiFetch(`/journals/journals/${id}/`, {
        method: 'DELETE',
      }),
    
    createCategory: (categoryData: any) =>
      apiFetch('/journals/categories/', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      }),
    
    deleteCategory: (id: string) =>
      apiFetch(`/journals/categories/${id}/`, {
        method: 'DELETE',
      }),
    
    listIssues: () => apiFetch('/journals/issues/'),
    /** Public issue data for share link (no auth required). */
    getPublicIssue: (id: string) => apiFetch(`/journals/issues/${id}/public/`),
    
    createIssue: async (issueData: any, collectionFile?: File) => {
      if (collectionFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all issue data fields
        Object.keys(issueData).forEach(key => {
          const value = issueData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Convert arrays to JSON strings
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add the collection file
        formData.append('collection_file', collectionFile);
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/journals/issues/`, {
          method: 'POST',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error: Record<string, unknown>;
          try {
            error = JSON.parse(errorText) as Record<string, unknown>;
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          const message = formatApiErrorMessage(error, response.status);
          throw new Error(message);
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch('/journals/issues/', {
          method: 'POST',
          body: JSON.stringify(issueData),
        });
      }
    },
    
    updateIssue: async (id: string, issueData: any, collectionFile?: File) => {
      if (collectionFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add all issue data fields
        Object.keys(issueData).forEach(key => {
          const value = issueData[key];
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Convert arrays to JSON strings
              formData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value);
            }
          }
        });
        
        // Add the collection file
        formData.append('collection_file', collectionFile);
        
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Don't set Content-Type header for FormData, let browser set it
        delete (headers as any)['Content-Type'];
        
        const response = await fetch(`${API_BASE_URL}/journals/issues/${id}/`, {
          method: 'PUT',
          headers,
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let error: Record<string, unknown>;
          try {
            error = JSON.parse(errorText) as Record<string, unknown>;
          } catch (e) {
            error = { detail: errorText || 'Unknown error' };
          }
          throw new Error(formatApiErrorMessage(error, response.status));
        }
        
        const text = await response.text();
        if (!text) return {};
        
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Invalid response format');
        }
      } else {
        // Regular JSON request
        return apiFetch(`/journals/issues/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(issueData),
        });
      }
    },
    
    deleteIssue: (id: string) =>
      apiFetch(`/journals/issues/${id}/`, {
        method: 'DELETE',
      }),
  },

  // Payments
  payments: {
    listTransactions: () => apiFetch('/payments/transactions/'),

    getTransaction: (id: string) => apiFetch(`/payments/transactions/${id}/`),

    createTransaction: (transactionData: any) =>
      apiFetch('/payments/transactions/', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      }),

    processPayment: (id: string, provider: 'click' | 'payme' = 'click') =>
      apiFetch(`/payments/transactions/${id}/process_payment/?provider=${provider}`, {
        method: 'POST',
      }),

    preparePayment: (id: string) =>
      apiFetch(`/payments/transactions/${id}/prepare_payment/`, {
        method: 'POST',
      }),

    checkStatus: (id: string) =>
      apiFetch(`/payments/transactions/${id}/check_status/`, {
        method: 'POST',
      }),
  },

  // UDC (UDK) — Universal Decimal Classification, teacode.com + O'zbekiston
  udc: {
    price: () => apiFetch('/udc/price/'),
    root: () => apiFetch('/udc/root/'),
    children: (path: string) => apiFetch(`/udc/children/?path=${encodeURIComponent(path)}`),
    search: (q: string, limit?: number) =>
      apiFetch(`/udc/search/?q=${encodeURIComponent(q)}${limit != null ? `&limit=${limit}` : ''}`),
    /** Maqola uchun (article_id) yoki mustaqil mavzu/fayl (title, abstract, author_name majburiy; file ixtiyoriy). */
    requestDocument: (data: {
      article_id?: string;
      udk_code?: string;
      udk_description?: string;
      title?: string;
      abstract?: string;
      author_name?: string;
      file?: File;
    }) => {
      if (data.article_id) {
        return apiFetch('/udc/request-document/', {
          method: 'POST',
          body: JSON.stringify({ article_id: data.article_id, udk_code: data.udk_code, udk_description: data.udk_description }),
        });
      }
      const title = (data.title || '').trim();
      const author_name = (data.author_name || '').trim();
      if (!title) throw new Error('Mavzu (title) majburiy.');
      if (!author_name) throw new Error('Ism, familya, otchestva majburiy.');
      if (data.file) {
        const form = new FormData();
        form.append('title', title);
        form.append('abstract', data.abstract || '');
        form.append('author_name', author_name);
        form.append('file', data.file);
        return apiFetch('/udc/request-document/', { method: 'POST', body: form });
      }
      return apiFetch('/udc/request-document/', {
        method: 'POST',
        body: JSON.stringify({ title, abstract: data.abstract || '', author_name }),
      });
    },
    myCertificates: () => apiFetch('/udc/my-certificates/'),
    /** Standalone UDK ma'lumotnomani yuklab olish (auth bilan). */
    downloadCertificate: async (id: number): Promise<void> => {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/udc/certificates/${id}/download/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Yuklab olishda xatolik');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `udk_malumotnoma_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    // UDK Request endpoints (DOI kabi workflow)
    /** UDK so'rovlari ro'yxati - taqrizchi barcha, muallif faqat o'zini */
    requests: {
      list: () => apiFetch('/udc/requests/'),
      /** Yangi UDK so'rovi yaratish */
      create: (data: {
        author_first_name: string;
        author_last_name: string;
        author_middle_name?: string;
        title: string;
        abstract: string;
        file?: File;
      }) => {
        if (data.file) {
          const form = new FormData();
          form.append('author_first_name', data.author_first_name);
          form.append('author_last_name', data.author_last_name);
          if (data.author_middle_name) form.append('author_middle_name', data.author_middle_name);
          form.append('title', data.title);
          form.append('abstract', data.abstract);
          form.append('file', data.file);
          return apiFetch('/udc/request/', { method: 'POST', body: form });
        }
        return apiFetch('/udc/request/', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      /** UDK so'rovni yakunlash (taqrizchi) */
      complete: (id: string, udk_code: string, udk_description?: string) =>
        apiFetch(`/udc/requests/${id}/complete/`, {
          method: 'PATCH',
          body: JSON.stringify({ udk_code, udk_description }),
        }),
      /** UDK so'rovni rad etish (taqrizchi) */
      reject: (id: string, reject_reason?: string) =>
        apiFetch(`/udc/requests/${id}/reject/`, {
          method: 'PATCH',
          body: JSON.stringify({ reject_reason }),
        }),
    },
    /** Service prices management (bosh admin uchun) */
    servicePrices: {
      list: () => apiFetch('/udc/service-prices/'),
      get: (id: number) => apiFetch(`/udc/service-prices/${id}/`),
      create: (data: { service_key: string; label: string; amount: number }) =>
        apiFetch('/udc/service-prices/', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: number, data: { amount?: number; label?: string }) =>
        apiFetch(`/udc/service-prices/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        apiFetch(`/udc/service-prices/${id}/`, {
          method: 'DELETE',
        }),
    },
  },

  // Translations
  translations: {
    list: () => apiFetch('/translations/'),

    get: (id: string) => apiFetch(`/translations/${id}/`),

    create: (translationData: any) => {
      // Handle file uploads for translations
      if (translationData.file) {
        const formData = new FormData();
        formData.append('source_file_path', translationData.file);
        Object.keys(translationData).forEach(key => {
          if (key !== 'file') {
            formData.append(key, translationData[key]);
          }
        });
        return apiFetch('/translations/', {
          method: 'POST',
          body: formData,
          headers: {}, // Let fetch set Content-Type for FormData
        });
      }
      
      return apiFetch('/translations/', {
        method: 'POST',
        body: JSON.stringify(translationData),
      });
    },

    update: (id: string, translationData: any) => {
      // Handle file uploads for translations
      if (translationData.file) {
        const formData = new FormData();
        if (translationData.file) {
          formData.append('translated_file_path', translationData.file);
        }
        Object.keys(translationData).forEach(key => {
          if (key !== 'file') {
            formData.append(key, translationData[key]);
          }
        });
        return apiFetch(`/translations/${id}/`, {
          method: 'PUT',
          body: formData,
          headers: {}, // Let fetch set Content-Type for FormData
        });
      }
      
      return apiFetch(`/translations/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(translationData),
      });
    },
    
    delete: (id: string) =>
      apiFetch(`/translations/${id}/`, {
        method: 'DELETE',
      }),
  },

  // Reviews
  reviews: {
    list: () => apiFetch('/reviews/'),

    get: (id: string) => apiFetch(`/reviews/${id}/`),

    create: (reviewData: any) =>
      apiFetch('/reviews/', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),

    update: (id: string, reviewData: any) =>
      apiFetch(`/reviews/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      }),
      
    delete: (id: string) =>
      apiFetch(`/reviews/${id}/`, {
        method: 'DELETE',
      }),

    acceptReview: (id: string) =>
      apiFetch(`/reviews/${id}/accept_review/`, { method: 'POST' }),

    declineReview: (id: string) =>
      apiFetch(`/reviews/${id}/decline_review/`, { method: 'POST' }),

    submitReview: (id: string, reviewData: any) =>
      apiFetch(`/reviews/${id}/submit_review/`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),
  },

  // Notifications
  notifications: {
    list: () => apiFetch('/notifications/'),

    markRead: (id: string) =>
      apiFetch(`/notifications/${id}/mark_read/`, {
        method: 'POST',
      }),

    markAllRead: () =>
      apiFetch('/notifications/mark_all_read/', {
        method: 'POST',
      }),

    unreadCount: () => apiFetch('/notifications/unread_count/'),
  },

  // File upload helper
  uploadFile: async (endpoint: string, file: File, additionalData?: any) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'File upload failed');
    }

    return response.json();
  },

  // Get media URL
  getMediaUrl: (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${MEDIA_URL}${path}`;
  },

  // Scientific Fields
  scientificFields: {
    list: () => apiFetch('/journals/scientific-fields/'),
    get: (id: string) => apiFetch(`/journals/scientific-fields/${id}/`),
    create: (fieldData: any) =>
      apiFetch('/journals/scientific-fields/', {
        method: 'POST',
        body: JSON.stringify(fieldData),
      }),
    update: (id: string, fieldData: any) =>
      apiFetch(`/journals/scientific-fields/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(fieldData),
      }),
    delete: (id: string) =>
      apiFetch(`/journals/scientific-fields/${id}/`, {
        method: 'DELETE',
      }),
  },

  // Conferences
  conferences: {
    list: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch(`/journals/conferences/${query}`);
    },
    get: (id: string) => apiFetch(`/journals/conferences/${id}/`),
    create: (conferenceData: any) =>
      apiFetch('/journals/conferences/', {
        method: 'POST',
        body: JSON.stringify(conferenceData),
      }),
    update: (id: string, conferenceData: any) =>
      apiFetch(`/journals/conferences/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(conferenceData),
      }),
    delete: (id: string) =>
      apiFetch(`/journals/conferences/${id}/`, {
        method: 'DELETE',
      }),
  },

  // Author Publications
  authorPublications: {
    list: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch(`/journals/author-publications/${query}`);
    },
    get: (id: string) => apiFetch(`/journals/author-publications/${id}/`),
    create: (publicationData: any) =>
      apiFetch('/journals/author-publications/', {
        method: 'POST',
        body: JSON.stringify(publicationData),
      }),
    update: (id: string, publicationData: any) =>
      apiFetch(`/journals/author-publications/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(publicationData),
      }),
    delete: (id: string) =>
      apiFetch(`/journals/author-publications/${id}/`, {
        method: 'DELETE',
      }),
    myPublications: () => apiFetch('/journals/author-publications/my_publications/'),
    publicationTypes: () => apiFetch('/journals/author-publications/publication_types/'),
    statistics: () => apiFetch('/journals/author-publications/statistics/'),
  },
};

export default apiService;