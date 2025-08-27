/**
 * API service for communicating with the ATMA backend
 */

export interface Chapter {
  title: string;
  script: string;
}

export interface ScriptParseRequest {
  raw_script: string;
}

export interface ScriptParseResponse {
  chapters: Chapter[];
}

export interface ApiError {
  detail: string;
}

class ApiService {
  private baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api/v1' : '/api/v1';

  /**
   * Parse raw story text into structured chapters (requires authentication)
   */
  async parseScript(rawScript: string): Promise<ScriptParseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/script/parse/`, {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_script: rawScript,
        } as ScriptParseRequest),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        const errorData: ApiError = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ScriptParseResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse script due to network error');
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await fetch('/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error('Health check failed');
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
