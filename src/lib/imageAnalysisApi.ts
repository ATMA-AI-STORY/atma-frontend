/**
 * Image Analysis API service for communicating with the ATMA backend image analysis endpoints
 */

export interface ImageAnalysisRequest {
  images: {
    img_id: string;
    metadata: any; // Using any to match the flexible metadata structure
  }[];
  request_timestamp?: string;
}

export interface FaceData {
  face_id: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  face_area: number;
  demographics: {
    age: number;
    gender: Record<string, number>;
    race: Record<string, number>;
  };
  emotion: {
    dominant: string;
    confidence: number;
    all_emotions: Record<string, number>;
  };
  is_primary: boolean;
}

export interface ObjectData {
  object_class: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageAnalysisResult {
  image_id: string;
  success: boolean;
  error_message: string | null;
  processing_time_ms: number;
  analysis_timestamp: string;
  face_analysis: {
    faces_detected: number;
    faces_data: FaceData[];
    primary_person?: FaceData;
  };
  object_analysis: {
    objects_detected: ObjectData[];
    scene_type: string;
    object_count: number;
    confidence_threshold: number;
  };
  summary: {
    total_faces: number;
    has_primary_person: boolean;
    objects_detected: number;
    scene_type: string;
    demographics_summary: {
      gender_distribution: Record<string, number>;
      age_stats: {
        average_age: number;
        age_range: number[];
      };
    };
    emotion_summary: {
      dominant_emotions: Record<string, number>;
      overall_mood: string;
    };
  };
}

export interface ImageAnalysisResponse {
  batch_id: string;
  total_images: number;
  successful_analyses: number;
  failed_analyses: number;
  total_processing_time_ms: number;
  analysis_timestamp: string;
  results: ImageAnalysisResult[];
}

class ImageAnalysisApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Get authorization headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Analyze a batch of images
   */
  async analyzeBatch(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      console.log('🔍 ImageAnalysisAPI: Starting batch analysis for', request.images.length, 'images');
      
      const response = await fetch(`${this.baseUrl}/api/v1/image-analysis/batch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          request_timestamp: request.request_timestamp || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        const errorData = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ImageAnalysisResponse = await response.json();
      
      console.log('✅ ImageAnalysisAPI: Batch analysis completed:', {
        batchId: result.batch_id,
        totalImages: result.total_images,
        successfulAnalyses: result.successful_analyses,
        failedAnalyses: result.failed_analyses,
        processingTimeMs: result.total_processing_time_ms,
      });

      return result;
    } catch (error) {
      console.error('❌ ImageAnalysisAPI: Batch analysis failed:', error);
      throw error;
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/image-analysis/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🏥 ImageAnalysisAPI: Health check:', result);
      return result;
    } catch (error) {
      console.error('❌ ImageAnalysisAPI: Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get available models and capabilities
   */
  async getModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/image-analysis/models`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🤖 ImageAnalysisAPI: Available models:', result);
      return result;
    } catch (error) {
      console.error('❌ ImageAnalysisAPI: Get models failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const imageAnalysisApiService = new ImageAnalysisApiService();
