/**
 * API Service for Phoenix Scientific Platform
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://127.0.0.1:8000/media/';

// Get token from localStorage
const getToken = () => localStorage.getItem('access_token');

// Set token
const setToken = (token: string) => localStorage.setItem('access_token', token);

// Remove token
const removeToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Base fetch with authentication
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      removeToken();
      window.location.href = '/#/login';
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (e) {
        error = { detail: errorText || 'Unknown error' };
      }
      console.error(`API request to ${endpoint} failed with status ${response.status}:`, error);
      throw new Error(error.detail || error.message || `API request failed with status ${response.status}`);
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
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
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
      
    stats: () => apiFetch('/auth/stats/'),
  },

  // Articles
  articles: {
    list: (params?: any) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch(`/articles/${query}`);
    },

    get: (id: string) => apiFetch(`/articles/${id}/`),

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

    createTransaction: (transactionData: any) =>
      apiFetch('/payments/transactions/', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      }),

    processPayment: (id: string) =>
      apiFetch(`/payments/transactions/${id}/process_payment/`, {
        method: 'POST',
      }),
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
};

export default apiService;