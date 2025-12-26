import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Notification } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  // Notification state and functions
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

// Create the context with a default value that matches AuthContextType
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  loading: false,
  error: null,
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  unreadCount: 0,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationIdCounter = React.useRef<number>(Date.now());

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const response = await apiService.auth.getProfile();
          const userData = response?.data || response;
          
          if (!userData) {
            throw new Error('No user data in response');
          }
          
          // Map the API response to our User type
          const user: User = {
            id: userData.id || '',
            firstName: userData.first_name || userData.firstName || '',
            lastName: userData.last_name || userData.lastName || '',
            patronymic: userData.patronymic || '',
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role || 'author',
            affiliation: userData.affiliation || '',
            gamificationProfile: userData.gamification_profile || {
              level: 'Beginner',
              badges: [],
              points: 0
            },
            avatarUrl: userData.avatar_url || userData.avatarUrl || '',
            telegramUsername: userData.telegram_username || userData.telegramUsername || ''
          };
          
          setUser(user);
          
          // Load notifications for the user
          try {
            const notificationsData = await apiService.notifications.list();
            const notificationsArray = Array.isArray(notificationsData) 
              ? notificationsData 
              : (notificationsData?.data && Array.isArray(notificationsData.data) 
                  ? notificationsData.data 
                  : []);
            
            // Map backend notifications to frontend Notification type
            const mappedNotifications: Notification[] = notificationsArray.map((n: any) => ({
              id: n.id,
              message: n.message,
              read: n.read,
              link: n.link || undefined
            }));
            
            setNotifications(mappedNotifications);
          } catch (notificationsError) {
            console.error('Failed to fetch notifications:', notificationsError);
            // Continue without notifications if fetch fails
          }
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          // If we can't get the profile, clear auth and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error in loadUser:', error);
        // On any error, clear auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const login = async (phone: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.auth.login(phone, password);
      
      // Handle different response formats
      const responseData = response?.data || response;
      
      // Extract tokens and user data from different possible response structures
      const accessToken = responseData?.access || responseData?.access_token;
      const refreshToken = responseData?.refresh || responseData?.refresh_token;
      const userData = responseData?.user || responseData;
      
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // If we have user data in the response, use it directly
        if (userData?.id) {
          const user: User = {
            id: userData.id,
            firstName: userData.first_name || userData.firstName || '',
            lastName: userData.last_name || userData.lastName || '',
            patronymic: userData.patronymic || '',
            email: userData.email || '',
            phone: userData.phone || phone,
            role: userData.role || 'author',
            affiliation: userData.affiliation || '',
            gamificationProfile: userData.gamification_profile || userData.gamificationProfile || {
              level: 'Beginner',
              badges: [],
              points: 0
            },
            avatarUrl: userData.avatar_url || userData.avatarUrl || '',
            telegramUsername: userData.telegram_username || userData.telegramUsername || ''
          };
          
          setUser(user);
          navigate('/dashboard');
          return true;
        }
        
        // If no user data in response, try to fetch it
        try {
          const profileResponse = await apiService.auth.getProfile();
          if (profileResponse?.data) {
            const profileData = profileResponse.data;
            const user: User = {
              id: profileData.id,
              firstName: profileData.first_name || profileData.firstName || '',
              lastName: profileData.last_name || profileData.lastName || '',
              patronymic: profileData.patronymic || '',
              email: profileData.email || '',
              phone: profileData.phone || phone,
              role: profileData.role || 'author',
              affiliation: profileData.affiliation || '',
              gamificationProfile: profileData.gamification_profile || {
                level: 'Beginner',
                badges: [],
                points: 0
              },
              avatarUrl: profileData.avatar_url || profileData.avatarUrl || '',
              telegramUsername: profileData.telegram_username || profileData.telegramUsername || ''
            };
            setUser(user);
          }
          navigate('/dashboard');
          return true;
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          // Still consider login successful if we have tokens
          navigate('/dashboard');
          return true;
        }
      }
      
      setError('Server response did not include access token');
      return false;
    } catch (error: any) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error?.response?.data) {
        // Handle Axios error response
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    apiService.auth.logout();
    navigate('/login');
  }, [navigate]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: notificationIdCounter.current++,
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  }, []);

  const markAsRead = useCallback((id: number) => {
    // Update local state immediately for UI responsiveness
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    
    // Also update backend
    apiService.notifications.markRead(id.toString()).catch(error => {
      console.error('Failed to mark notification as read on backend:', error);
      // If backend update fails, we could revert the local change
      // but for now we'll just log the error and keep the UI updated
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    // Update local state immediately for UI responsiveness
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    
    // Also update backend
    apiService.notifications.markAllRead().catch(error => {
      console.error('Failed to mark all notifications as read on backend:', error);
      // If backend update fails, we could revert the local change
      // but for now we'll just log the error and keep the UI updated
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error,
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useNotifications = () => {
  const { notifications, addNotification, markAsRead, markAllAsRead, unreadCount } = useAuth();
  return { notifications, addNotification, markAsRead, markAllAsRead, unreadCount };
};