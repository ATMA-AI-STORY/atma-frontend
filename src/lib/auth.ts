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
      console.log('Getting current user, token exists:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Making request to:', `${this.baseUrl}/api/v1/auth/me`);
      const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
        headers,
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, clearing token');
          // Clear invalid token
          localStorage.removeItem('access_token');
          return null; // Not authenticated
        }
        console.error('Failed to get user info:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const userData = await response.json();
      console.log('Received user data:', userData);
      
      // Validate that we have the required fields
      if (!userData.email || !userData.name || !userData.user_id) {
        console.error('Invalid user data received:', userData);
        throw new Error('Invalid user data received from server');
      }
      
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
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
