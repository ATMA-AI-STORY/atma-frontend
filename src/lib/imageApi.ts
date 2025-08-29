/**
 * Image API service for communicating with the ATMA backend image endpoints
 */

export interface ImageMetadata {
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
  };
  settings?: {
    iso?: number;
    aperture?: string;
    shutter_speed?: string;
    focal_length?: string;
    flash?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    location_name?: string;
  };
  datetime?: {
    taken?: string;
    modified?: string;
    timezone?: string;
  };
  technical?: {
    color_space?: string;
    orientation?: number;
    resolution?: {
      x?: number;
      y?: number;
      unit?: string;
    };
  };
}

export interface ImageUploadResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: ImageMetadata;
  upload_url: string;
}

export interface ImageResponse {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ImageListResponse {
  images: ImageResponse[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class ImageApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Get authorization headers for API requests
   */
  private getHeaders(includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Upload a single image file
   */
  async uploadImage(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = this.getHeaders(false); // Don't include Content-Type for FormData
      delete headers['Content-Type']; // Let browser set it with boundary

      console.log('📸 ImageAPI: Uploading image:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

      // Create a promise that tracks upload progress
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              };
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          resolve(new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText
          }));
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${this.baseUrl}/api/v1/images/upload`);
        
        // Set authorization header
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ImageUploadResponse = await response.json();
      
      // Log metadata to console as requested
      console.log('📊 ImageAPI: Upload successful with metadata:', {
        imageId: result.id,
        filename: result.original_filename,
        processing_status: result.processing_status,
        metadata: result.metadata
      });

      return result;
    } catch (error) {
      console.error('❌ ImageAPI: Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images sequentially
   */
  async uploadImages(
    files: File[], 
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: ImageUploadResponse) => void
  ): Promise<ImageUploadResponse[]> {
    const results: ImageUploadResponse[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.uploadImage(file, (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        });
        
        results.push(result);
        
        if (onFileComplete) {
          onFileComplete(i, result);
        }
      } catch (error) {
        console.error(`❌ ImageAPI: Failed to upload file ${i + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Get list of user's images
   */
  async listImages(page = 1, perPage = 20): Promise<ImageListResponse> {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/v1/images/?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Failed to list images' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ImageListResponse = await response.json();
      console.log(`📋 ImageAPI: Listed ${result.images.length} images (page ${page})`);
      
      return result;
    } catch (error) {
      console.error('❌ ImageAPI: Failed to list images:', error);
      throw error;
    }
  }

  /**
   * Get image details
   */
  async getImage(imageId: string): Promise<ImageResponse> {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/images/${imageId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 404) {
          throw new Error('Image not found.');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Failed to get image' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ImageResponse = await response.json();
      
      // Log metadata to console
      console.log('📸 ImageAPI: Image details retrieved:', {
        imageId: result.id,
        filename: result.original_filename,
        processing_status: result.processing_status,
        metadata: result.metadata
      });
      
      return result;
    } catch (error) {
      console.error('❌ ImageAPI: Failed to get image:', error);
      throw error;
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/images/${imageId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 404) {
          throw new Error('Image not found.');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete image' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('🗑️ ImageAPI: Image deleted successfully:', imageId);
    } catch (error) {
      console.error('❌ ImageAPI: Failed to delete image:', error);
      throw error;
    }
  }

  /**
   * Get image file URL for display
   */
  getImageUrl(imageId: string): string {
    const token = localStorage.getItem('access_token');
    const baseUrl = `${this.baseUrl}/api/v1/images/${imageId}/file`;
    
    if (token) {
      return `${baseUrl}?token=${encodeURIComponent(token)}`;
    }
    
    return baseUrl;
  }
}

export const imageApiService = new ImageApiService();
