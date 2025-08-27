/**
 * Authentication service for frontend Google OAuth integration
 */

export interface User {
  user_id: string;  // Changed from 'id' to match backend
  email: string;
  name: string;
  picture: string;
  is_active: boolean;  // Added to match backend
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Initiate Google OAuth login by redirecting to backend
   */
  async login(): Promise<void> {
    window.location.href = `${this.baseUrl}/api/v1/auth/google/login`;
  }

  /**
   * Get current authenticated user info
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 getCurrentUser: Token exists:', !!token);
      console.log('🔍 getCurrentUser: Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        console.log('❌ getCurrentUser: No token found');
        return null;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const url = `${this.baseUrl}/api/v1/auth/me`;
      console.log('🌐 getCurrentUser: Making request to:', url);
      console.log('📋 getCurrentUser: Headers:', { ...headers, Authorization: 'Bearer [REDACTED]' });

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      console.log('📡 getCurrentUser: Response status:', response.status, response.statusText);
      console.log('📡 getCurrentUser: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ getCurrentUser: HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        if (response.status === 401) {
          console.log('🔑 getCurrentUser: Unauthorized, clearing token');
          localStorage.removeItem('access_token');
          return null;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const userData = await response.json();
      console.log('✅ getCurrentUser: Received user data:', userData);
      
      // Validate that we have the required fields
      const requiredFields = ['email', 'name', 'user_id'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ getCurrentUser: Missing required fields:', missingFields);
        console.error('❌ getCurrentUser: Received data:', userData);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ getCurrentUser: User data validated successfully');
      return userData;
    } catch (error) {
      console.error('💥 getCurrentUser: Error occurred:', error);
      if (error instanceof Error) {
        console.error('💥 getCurrentUser: Error message:', error.message);
        console.error('💥 getCurrentUser: Error stack:', error.stack);
      }
      return null;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      // Clear token from localStorage
      localStorage.removeItem('access_token');
      
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear token and redirect even if logout request fails
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
  }

  /**
   * Check if user is authenticated by checking current user
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export const authService = new AuthService();
