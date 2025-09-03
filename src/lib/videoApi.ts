/**
 * Video API service for generating and managing video previews
 * Integrates with backend /api/v1/video/ endpoints
 */

export interface VideoGenerationRequest {
  mappings: Array<{
    chapter_title: string;
    chapter_index: number;
    images: Array<{
      img_id: string;
      duration: number; // Duration in milliseconds
    }>;
    script: string;
  }>;
}

export interface VideoPreviewResponse {
  video_preview_path: string;
  generation_id?: string;
  duration?: number;
  duration_ms?: number;
  total_chapters?: number;
  total_images?: number;
  status: 'generating' | 'completed' | 'failed' | 'success';
  created_at?: string;
  message?: string;
  metadata?: {
    preview_watermark: boolean;
    resolution: string;
    format: string;
  };
}

export interface VideoGenerationStatus {
  generation_id: string;
  status: 'generating' | 'completed' | 'failed';
  progress_percentage?: number;
  estimated_completion?: string;
  error_message?: string;
}

export interface VideoMetadata {
  filename: string;
  file_size: number;
  content_type: string;
  created_at: number;
  download_url: string;
  stream_url: string;
  video_info: {
    format: string;
    codec: string;
  };
}

export interface UserVideo {
  filename: string;
  created_at: number;
  file_size: number;
  download_url: string;
  stream_url: string;
}

export interface VideoListResponse {
  videos: UserVideo[];
  total_count: number;
  page?: number;
  page_size?: number;
}

export interface ApiError {
  detail: string;
}

class VideoApiService {
  private baseUrl: string;

  constructor() {
    // In development, use relative URLs to leverage Vite proxy
    // In production, use the environment variable
    if (import.meta.env.DEV) {
      this.baseUrl = ''; // Use relative URLs for Vite proxy
    } else {
      this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    }
  }

  /**
   * Get authentication headers with JWT token
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🎬 VideoAPI: Using auth token:', token.substring(0, 50) + '...');
      console.log('🎬 VideoAPI: Token length:', token.length);
      console.log('🎬 VideoAPI: Full Authorization header:', `Bearer ${token.substring(0, 50)}...`);
    } else {
      console.warn('🎬 VideoAPI: No auth token found in localStorage');
    }
    
    return headers;
  }

  /**
   * Generate video preview from chapters and images
   * POST /api/v1/video/generate-preview/
   */
  async generatePreview(request: VideoGenerationRequest): Promise<VideoPreviewResponse> {
    try {
      console.log('🎬 VideoAPI: Generating video preview with request:', request);

      const url = `${this.baseUrl}/api/v1/video/generate-preview/`;
      console.log('🎬 VideoAPI: Calling URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          console.error('❌ VideoAPI: Server error response:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('❌ VideoAPI: Failed to parse error response:', e);
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      const data: VideoPreviewResponse = await response.json();
      console.log('✅ VideoAPI: Video preview generated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ VideoAPI: Failed to generate video preview:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate video preview due to network error');
    }
  }

  /**
   * Check video generation status
   * GET /api/v1/video/status/{generation_id}
   */
  async getGenerationStatus(generationId: string): Promise<VideoGenerationStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/video/status/${generationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ VideoAPI: Failed to get generation status:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get video generation status');
    }
  }

  /**
   * Get video file URL for preview playback
   * The backend should serve video files with proper headers for streaming
   */
  getVideoUrl(videoPath: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
    
    if (import.meta.env.DEV) {
      // In development, use relative URL through Vite proxy
      return `/${cleanPath}`;
    } else {
      // In production, use full URL
      return `${this.baseUrl}/${cleanPath}`;
    }
  }

  /**
   * List all videos for the authenticated user
   * GET /api/v1/video/list/
   */
  async listUserVideos(): Promise<VideoListResponse> {
    try {
      console.log('🎬 VideoAPI: Fetching user videos list');

      const url = `${this.baseUrl}/api/v1/video/list/`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      const data: VideoListResponse = await response.json();
      console.log('✅ VideoAPI: User videos list retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ VideoAPI: Failed to fetch user videos:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user videos');
    }
  }

  /**
   * Get metadata for a specific video
   * GET /api/v1/video/metadata/{filename}
   */
  async getVideoMetadata(filename: string): Promise<VideoMetadata> {
    try {
      console.log('🎬 VideoAPI: Fetching metadata for video:', filename);

      const url = `${this.baseUrl}/api/v1/video/metadata/${encodeURIComponent(filename)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Access denied: You can only access your own videos.');
        }
        if (response.status === 404) {
          throw new Error('Video not found.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      const data: VideoMetadata = await response.json();
      console.log('✅ VideoAPI: Video metadata retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ VideoAPI: Failed to fetch video metadata:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch video metadata');
    }
  }

  /**
   * Get streaming URL for video playback
   * GET /api/v1/video/stream/{filename}
   */
  getStreamUrl(filename: string): string {
    const url = `${this.baseUrl}/api/v1/video/stream/${encodeURIComponent(filename)}`;
    return url;
  }

  /**
   * Download a video file
   * GET /api/v1/video/download/{filename}
   */
  async downloadVideo(filename: string): Promise<void> {
    try {
      console.log('🎬 VideoAPI: Downloading video:', filename);

      const url = `${this.baseUrl}/api/v1/video/download/${encodeURIComponent(filename)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Access denied: You can only download your own videos.');
        }
        if (response.status === 404) {
          throw new Error('Video not found.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ VideoAPI: Video download initiated:', filename);
    } catch (error) {
      console.error('❌ VideoAPI: Failed to download video:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to download video');
    }
  }

  /**
   * Delete a video file
   * DELETE /api/v1/video/delete/{filename}
   */
  async deleteVideo(filename: string): Promise<void> {
    try {
      console.log('🎬 VideoAPI: Deleting video:', filename);

      const url = `${this.baseUrl}/api/v1/video/delete/${encodeURIComponent(filename)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Access denied: You can only delete your own videos.');
        }
        if (response.status === 404) {
          throw new Error('Video not found.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ VideoAPI: Video deleted successfully:', result);
    } catch (error) {
      console.error('❌ VideoAPI: Failed to delete video:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete video');
    }
  }

  /**
   * Create authenticated video stream blob URL for HTML5 video element
   * This is needed for videos that require authentication headers
   */
  async createAuthenticatedVideoBlob(filename: string): Promise<string> {
    try {
      console.log('🎬 VideoAPI: Creating authenticated video blob for:', filename);

      const url = `${this.baseUrl}/api/v1/video/stream/${encodeURIComponent(filename)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('✅ VideoAPI: Authenticated video blob created');
      return blobUrl;
    } catch (error) {
      console.error('❌ VideoAPI: Failed to create authenticated video blob:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create video blob for playback');
    }
  }
}

// Export singleton instance
export const videoApiService = new VideoApiService();
