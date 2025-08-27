/**
 * Authentication service for frontend Google OAuth integration
 */

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
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
      const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const userData = await response.json();
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
      const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if logout request fails
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
