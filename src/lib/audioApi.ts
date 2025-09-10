/**
 * Audio Narration API service for voice generation and voice model management
 */

import { getAuthHeaders } from './auth';

export interface Voice {
  name: string;
  display_name: string;
  locale: string;
  gender: 'male' | 'female';
  suggested_codec: string;
  friendly_name: string;
}

export interface VoicesResponse {
  voices: Voice[];
  total_voices: number;
}

export interface VoiceConfig {
  voice_name: string;
  rate?: string;
  pitch?: string;
  volume?: string;
  style?: string;
}

export interface AudioMappingImage {
  img_id: string;
  duration: number;
}

export interface AudioMapping {
  chapter_title: string;
  chapter_index: number;
  script: string;
  images: AudioMappingImage[];
}

export interface AudioGenerationRequest {
  mappings: AudioMapping[];
  voice_config: VoiceConfig;
  subtitle_format?: 'vtt' | 'srt';
  merge_audio?: boolean;
  max_segment_length?: number;
  distribute_by_images?: boolean;
}

export interface SubtitleEntry {
  start_time: number;
  end_time: number;
  text: string;
  segment_index: number;
}

export interface AudioGenerationResponse {
  audio_file_path: string;
  subtitle_file_path: string;
  audio_duration: number;
  total_segments: number;
  file_size_bytes: number;
  subtitle_entries: SubtitleEntry[];
  voice_used: string;
  processing_time: number;
  metadata: {
    chapter_info: {
      total_chapters: number;
      total_images: number;
      total_script_chars: number;
      total_image_duration_ms: number;
      average_chapter_length: number;
      average_images_per_chapter: number;
      estimated_audio_duration_seconds: number;
    };
    chapter_count: number;
    segmentation_method: string;
    segments_per_chapter: Record<string, number>;
  };
}

export interface ApiError {
  detail: string;
}

class AudioNarrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Get all available voice models
   */
  async getVoices(): Promise<VoicesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/audio-narration/voices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch voices' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Generate audio narration with specified voice and mappings
   */
  async generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/audio-narration/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate audio' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  /**
   * Get audio file URL for playback
   */
  getAudioUrl(audioFilePath: string): string {
    // Remove leading path if it starts with /app/media/
    const cleanPath = audioFilePath.replace(/^\/app\/media\//, '');
    return `${this.baseUrl}/media/${cleanPath}`;
  }

  /**
   * Get subtitle file URL for download
   */
  getSubtitleUrl(subtitleFilePath: string): string {
    // Remove leading path if it starts with /app/media/
    const cleanPath = subtitleFilePath.replace(/^\/app\/media\//, '');
    return `${this.baseUrl}/media/${cleanPath}`;
  }
}

// Export singleton instance
export const audioNarrationService = new AudioNarrationService();
export default audioNarrationService;
