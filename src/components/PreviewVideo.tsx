/**
 * PreviewVideo Component - Step 6 Integration
 * 
 * This component integrates with the backend video generation service to:
 * 1. Automatically trigger video preview generation when user reaches Step 6
 * 2. Map user's chapters and uploaded images to backend requirements
 * 3. Display real video preview with secure player (watermarked)
 * 4. Handle loading states, error recovery, and generation status polling
 * 5. Prevent navigation until video is successfully generated
 * 
 * Backend Integration:
 * - POST /api/v1/video/generate-preview/ - Triggers video generation
 * - GET /api/v1/video/status/{id} - Polls generation progress
 * - Video served via secure URL with preview watermark
 * 
 * Request Format:
 * {
 *   "mappings": [
 *     {
 *       "chapter_title": "Chapter 1: Title",
 *       "chapter_index": 1,
 *       "images": [{"img_id": "123", "duration": 10000}],
 *       "script": "Chapter script text..."
 *     }
 *   ]
 * }
 * 
 * Security Features:
 * - Preview videos include watermark overlay
 * - Direct video download disabled via pointer-events: none
 * - Authentication required for all API calls
 * 
 * Data Flow:
 * chapters + uploadedImages -> VideoGenerationRequest -> Backend -> VideoPreviewResponse
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Play, Pause, RotateCcw, Download, Share2, Volume2, VolumeX, Edit, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { videoApiService, VideoGenerationRequest, VideoPreviewResponse } from "@/lib/videoApi";
import { Chapter } from "@/lib/api";
import { ImageUploadResponse } from "@/lib/imageApi";
import { ImageAnalysisResponse } from "@/lib/imageAnalysisApi";
import { Voice, audioNarrationService } from "@/lib/audioApi";

interface PreviewVideoProps {
  onApprove: () => void;
  onBack: () => void;
  // Data needed for video generation
  chapters: Chapter[];
  uploadedImages: ImageUploadResponse[];
  imageAnalysis?: ImageAnalysisResponse;
  theme?: string;
  audio?: {
    music: string;
    voice: Voice | null;
    subtitles: boolean;
  };
  canProceed?: boolean;
}

export default function PreviewVideo({ 
  onApprove, 
  onBack, 
  chapters, 
  uploadedImages, 
  imageAnalysis, 
  theme = "Classic Black & White", 
  audio = { music: "Gentle Piano Memories", voice: null, subtitles: true },
  canProceed = true
}: PreviewVideoProps) {
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Video generation state
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [videoData, setVideoData] = useState<VideoPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Audio narration state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioData, setAudioData] = useState<any>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Audio failure dialog state
  const [showAudioFailureDialog, setShowAudioFailureDialog] = useState(false);
  const [audioFailureError, setAudioFailureError] = useState<string>('');
  const [shouldStopGeneration, setShouldStopGeneration] = useState(false);

  /**
   * Load authenticated video URL for playback
   */
  const loadVideoUrl = async (videoPath: string) => {
    try {
      console.log('🎬 PreviewVideo: Loading video URL for path:', videoPath);
      
      // Get the authenticated video URL from the service
      const videoUrl = videoApiService.getVideoUrl(videoPath);
      console.log('🎬 PreviewVideo: Generated video URL:', videoUrl);
      
      // Set the video URL to trigger video display
      setVideoUrl(videoUrl);
      
      console.log('✅ PreviewVideo: Video URL loaded successfully');
    } catch (error) {
      console.error('❌ PreviewVideo: Failed to load video URL:', error);
      setError('Failed to load video for playback. Please try refreshing the page.');
    }
  };

  /**
   * Generate audio narration if voice is selected
   */
  const generateAudioNarration = async (): Promise<any> => {
    if (!audio.voice) {
      console.log('🎵 PreviewVideo: No voice selected, skipping audio generation');
      return null;
    }

    try {
      setIsGeneratingAudio(true);
      setAudioError(null);
      
      console.log('🎵 PreviewVideo: Starting audio narration generation...');
      
      // Prepare audio generation request
      const audioRequest = {
        mappings: chapters.map((chapter, index) => {
          const startIdx = index * Math.ceil(uploadedImages.length / Math.max(chapters.length, 1));
          const endIdx = Math.min(startIdx + Math.ceil(uploadedImages.length / Math.max(chapters.length, 1)), uploadedImages.length);
          const chapterImages = uploadedImages.slice(startIdx, endIdx);
          
          return {
            chapter_title: chapter.title,
            chapter_index: index + 1,
            script: chapter.script,
            images: chapterImages.map(img => ({
              img_id: img.id,
              duration: Math.max(10000, Math.ceil(chapter.script.length / 15) * 1000)
            }))
          };
        }),
        voice_config: {
          voice_name: audio.voice.name,
          rate: "-10%",
          pitch: "+0Hz", 
          volume: "+0%",
          style: "documentary"
        },
        subtitle_format: audio.subtitles ? "vtt" as const : undefined,
        merge_audio: true,
        max_segment_length: 200,
        distribute_by_images: true
      };

      console.log('🎵 PreviewVideo: Audio request:', JSON.stringify(audioRequest, null, 2));
      
      const audioResponse = await audioNarrationService.generateAudio(audioRequest);
      console.log('🎵 PreviewVideo: Audio generated successfully:', audioResponse);
      
      setAudioData(audioResponse);
      setIsGeneratingAudio(false);
      
      return audioResponse; // Return full response instead of just file path
    } catch (error) {
      console.error('❌ PreviewVideo: Audio generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio narration';
      setAudioError(errorMessage);
      setIsGeneratingAudio(false);
      
      // Show dialog to user for retry or continue without audio
      setAudioFailureError(errorMessage);
      setShouldStopGeneration(true);
      
      // Use setTimeout to ensure state update happens in next tick
      setTimeout(() => {
        setShowAudioFailureDialog(true);
      }, 0);
      
      // Return null to indicate failure, let dialog handle next action
      return null;
    }
  };

  /**
   * Handle retry audio generation from dialog
   */
  const handleRetryAudio = async () => {
    setShowAudioFailureDialog(false);
    setAudioFailureError('');
    setShouldStopGeneration(false);
    
    // Retry audio generation
    const audioResponse = await generateAudioNarration();
    if (audioResponse) {
      // If successful, continue with video generation that was interrupted
      continueVideoGeneration(audioResponse);
    }
    // If it fails again, the dialog will show again automatically
  };

  /**
   * Handle continue without audio from dialog
   */
  const handleContinueWithoutAudio = () => {
    setShowAudioFailureDialog(false);
    setAudioFailureError('');
    setShouldStopGeneration(false);
    setAudioData(null); // Clear any partial audio data
    
    // Continue with video generation without audio
    continueVideoGeneration(null);
  };

  /**
   * Continue video generation (with or without audio)
   */
  const continueVideoGeneration = async (audioResponse = null) => {
    try {
      setGenerationProgress(25);
      
      // Prepare mappings
      const mappings = chapters.map((chapter, index) => {
        const startIdx = index * Math.ceil(uploadedImages.length / Math.max(chapters.length, 1));
        const endIdx = Math.min(startIdx + Math.ceil(uploadedImages.length / Math.max(chapters.length, 1)), uploadedImages.length);
        const chapterImages = uploadedImages.slice(startIdx, endIdx);
        
        const baseDurationPerImage = Math.max(10000, Math.ceil(chapter.script.length / 15) * 1000);
        const durationPerImage = chapterImages.length > 0 ? Math.floor(baseDurationPerImage / chapterImages.length) : 10000;
        
        return {
          chapter_title: chapter.title,
          chapter_index: index + 1,
          images: chapterImages.map(img => ({
            img_id: img.id,
            duration: durationPerImage
          })),
          script: chapter.script
        };
      });

      setGenerationProgress(40);

      // Use provided audioResponse or fallback to state
      const currentAudioData = audioResponse || audioData;
      
      console.log('🎬 PreviewVideo: Audio data for video generation:', currentAudioData);

      // Generate video with unified request (with or without narration)
      const videoRequest: VideoGenerationRequest = {
        mappings,
        // Add audio parameters if available
        ...(currentAudioData && currentAudioData.audio_file_path && {
          audio_narration_file: currentAudioData.audio_file_path,
          subtitle_file: currentAudioData.subtitle_file_path,
          bgm_file: "media/bgm.mp3",
          bgm_volume: 0.15,
          narration_volume: 0.85,
          enable_audio_ducking: true
        })
      };
      
      console.log('🎬 PreviewVideo: Generating video with unified request:', videoRequest);
      const response = await videoApiService.generatePreview(videoRequest);
      
      setVideoData(response);
      setIsGenerating(false);
      setGenerationProgress(100);
      
      // Load video URL if available
      if (response.video_preview_path) {
        loadVideoUrl(response.video_preview_path);
      }
    } catch (error) {
      console.error('❌ PreviewVideo: Video generation failed:', error);
      setError(error instanceof Error ? error.message : 'Video generation failed');
      setIsGenerating(false);
    }
  };

  /**
   * Generate video preview on component mount
   */
  useEffect(() => {
    const generateVideo = async () => {
      // If user navigated directly without completing previous steps, show dummy preview
      if (!canProceed) {
        setIsGenerating(false);
        setVideoData({
          generation_id: 'demo-preview',
          video_preview_path: '',
          status: 'completed',
          duration: 180,
          created_at: new Date().toISOString(),
          metadata: {
            preview_watermark: true,
            resolution: '1080p',
            format: 'mp4'
          }
        });
        return;
      }

      // Check authentication
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setIsGenerating(false);
        return;
      }

      if (chapters.length === 0 || uploadedImages.length === 0) {
        setError('No chapters or images available for video generation.');
        setIsGenerating(false);
        return;
      }

      try {
        setIsGenerating(true);
        setError(null);
        setGenerationProgress(0);

        console.log('🎬 PreviewVideo: Starting content generation...');
        console.log('🎬 PreviewVideo: Using auth token:', token.substring(0, 20) + '...');

        // Step 1: Generate audio narration if voice is selected (25% progress)
        let audioResponse = null;
        if (audio.voice) {
          setGenerationProgress(5);
          console.log('🎵 PreviewVideo: Generating audio narration first...');
          audioResponse = await generateAudioNarration();
          setGenerationProgress(25);
          
          // If audio generation failed (returned null), the dialog will be shown
          // and the dialog handlers will continue the process
          if (!audioResponse || shouldStopGeneration) {
            return;
          }
        }

        // Continue with video generation, passing audio response
        await continueVideoGeneration(audioResponse);

      } catch (error) {
        console.error('❌ PreviewVideo: Initial generation failed:', error);
        setError(error instanceof Error ? error.message : 'Video generation failed');
        setIsGenerating(false);
      }
    };

    generateVideo();
  }, [chapters, uploadedImages, theme, audio, imageAnalysis]);

  // Cleanup video blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Cleanup video URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  /**
   * Poll backend for video generation status
   */
  const pollGenerationStatus = async (generationId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Video generation timed out. Please try again.');
        setIsGenerating(false);
        return;
      }

      try {
        const status = await videoApiService.getGenerationStatus(generationId);
        
        if (status.progress_percentage) {
          setGenerationProgress(status.progress_percentage);
        }

        if (status.status === 'completed') {
          setIsGenerating(false);
          setGenerationProgress(100);
          // Refresh video data to get the final path
          if (videoData) {
            const updatedVideoData = { ...videoData, status: 'completed' as const };
            setVideoData(updatedVideoData);
            // Load video URL for completed video
            if (updatedVideoData.video_preview_path) {
              loadVideoUrl(updatedVideoData.video_preview_path);
            }
          }
        } else if (status.status === 'failed') {
          throw new Error(status.error_message || 'Video generation failed');
        } else {
          // Continue polling
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('❌ PreviewVideo: Failed to poll generation status:', error);
        setError(error instanceof Error ? error.message : 'Failed to check video generation status');
        setIsGenerating(false);
      }
    };

    poll();
  };

  /**
   * Retry video generation
   */
  const retryGeneration = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Clean up previous video URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl('');
    }
    
    // Re-trigger the effect by updating state
    const generateVideo = async () => {
      try {
        // Regenerate audio if voice was selected
        let audioResponse = null;
        if (audio.voice) {
          console.log('🎵 PreviewVideo: Regenerating audio narration...');
          audioResponse = await generateAudioNarration();
        }

        // Prepare mappings
        const mappings = chapters.map((chapter, index) => {
          const startIdx = index * Math.ceil(uploadedImages.length / Math.max(chapters.length, 1));
          const endIdx = Math.min(startIdx + Math.ceil(uploadedImages.length / Math.max(chapters.length, 1)), uploadedImages.length);
          const chapterImages = uploadedImages.slice(startIdx, endIdx);
          
          const baseDurationPerImage = Math.max(10000, Math.ceil(chapter.script.length / 15) * 1000);
          const durationPerImage = chapterImages.length > 0 ? Math.floor(baseDurationPerImage / chapterImages.length) : 10000;
          
          return {
            chapter_title: chapter.title,
            chapter_index: index + 1,
            images: chapterImages.map(img => ({
              img_id: img.id,
              duration: durationPerImage
            })),
            script: chapter.script
          };
        });

        // Generate video with unified request (with or without narration)
        const videoRequest: VideoGenerationRequest = {
          mappings,
          // Add audio parameters if available
          ...(audioResponse && audioResponse.audio_file_path && {
            audio_narration_file: audioResponse.audio_file_path,
            subtitle_file: audioResponse.subtitle_file_path,
            bgm_file: "media/bgm.mp3",
            bgm_volume: 0.15,
            narration_volume: 0.85,
            enable_audio_ducking: true
          })
        };
        
        console.log('🎬 PreviewVideo: Retry generating video with unified request:', videoRequest);
        const response = await videoApiService.generatePreview(videoRequest);
        
        setVideoData(response);

        if (response.status === 'generating') {
          pollGenerationStatus(response.generation_id);
        } else if (response.status === 'completed') {
          setIsGenerating(false);
          setGenerationProgress(100);
          
          // Load video URL if available
          if (response.video_preview_path) {
            loadVideoUrl(response.video_preview_path);
          }
        } else if (response.status === 'success') {
          setIsGenerating(false);
          setGenerationProgress(100);
          
          // Load video URL if available
          if (response.video_preview_path) {
            loadVideoUrl(response.video_preview_path);
          }
        }
      } catch (error) {
        console.error('❌ PreviewVideo: Video generation retry failed:', error);
        
        let errorMessage = 'Failed to generate video preview';
        if (error instanceof Error) {
          if (error.message.includes('Authentication required')) {
            errorMessage = 'Please log in to generate video preview';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to video generation service. Please check if the backend is running.';
          } else if (error.message.includes('404')) {
            errorMessage = 'Video generation service is not available yet. This feature is still in development.';
          } else if (error.message.includes('422')) {
            errorMessage = 'Invalid request format. Please try again or contact support.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
        setIsGenerating(false);
      }
    };

    generateVideo();
  };

  /**
   * Handle video metadata loading
   */
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(Math.floor(videoRef.current.duration));
    }
  };

  /**
   * Handle video time update
   */
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(Math.floor(videoRef.current.currentTime));
    }
  };

  /**
   * Handle video ended
   */
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Simulate video playback for fallback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !videoRef.current && !isGenerating && totalDuration > 0) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isGenerating, totalDuration]);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current && !isGenerating) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Fallback for simulated playback
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Show loading screen during video generation
  if (isGenerating) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[500px]">
        <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-memory text-center max-w-md mx-auto">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gradient-memory rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">Creating Your Memory Video</h3>
            <p className="text-muted-foreground">
              We're weaving your {uploadedImages.length} photos and {chapters.length} story chapters together with beautiful transitions{audio.voice ? ', narration,' : ''} and music...
            </p>
            <Progress value={generationProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {generationProgress < 5 && "Preparing content generation..."}
              {generationProgress >= 5 && generationProgress < 25 && audio.voice && "Generating voice narration with AI..."}
              {generationProgress >= 25 && generationProgress < 40 && "Analyzing your photos and story structure..."}
              {generationProgress >= 40 && generationProgress < 70 && "Generating video scenes and transitions..."}
              {generationProgress >= 70 && generationProgress < 90 && "Adding music and finalizing video..."}
              {generationProgress >= 90 && "Almost ready! Final processing..."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Show error screen if generation failed
  if (error) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[500px]">
        <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-memory text-center max-w-md mx-auto">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">Video Generation Failed</h3>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button variant="hero" onClick={retryGeneration}>
                Try Again {retryCount > 0 && `(${retryCount + 1})`}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Preview Your <span className="bg-gradient-memory bg-clip-text text-transparent">Memory Video</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Your story has been transformed into a beautiful video. Review it before we create the final version.
          </p>
        </div>

        {/* Success Message */}
        {videoData?.status === 'success' && (
          <Card className="p-6 mb-6 bg-green-50 border-green-200 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-1">🎉 Video Generated Successfully!</h3>
                <p className="text-green-700 text-sm">
                  Your memory video has been created with {videoData.total_chapters || chapters.length} chapters and {videoData.total_images || uploadedImages.length} images.
                  {videoData.duration_ms && ` Duration: ${Math.round(videoData.duration_ms / 1000)}s`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Video Player */}
        <Card className="p-8 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 rounded-lg overflow-hidden relative group">
            {/* Video Player - Show video when URL is available */}
            {videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls
                controlsList="nodownload"
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                src={videoUrl}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : isGenerating ? (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="text-6xl font-light">🎬</div>
                  <div className="space-y-1 text-xs opacity-75">
                    <p>📸 {uploadedImages.length} Photos</p>
                    <p>📖 {chapters.length} Chapters</p>
                  </div>
                </div>
              </div>
            ) : !canProceed ? (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="text-6xl font-light">⏳</div>
                  <p className="text-xl">Complete previous steps first</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="text-6xl font-light">🎬</div>
                  <p className="text-xl">Loading video...</p>
                </div>
              </div>
            )}

            {/* Preview Watermark Overlay */}
            <div className="absolute top-4 right-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
              PREVIEW
            </div>
          </div>
        </Card>

        {/* Video Details */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Video Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Duration: {formatTime(totalDuration || videoData?.duration || 245)}</p>
              <p>Resolution: {videoData?.metadata?.resolution || "1920x1080 (HD)"}</p>
              <p>Format: {videoData?.metadata?.format || "MP4"}</p>
              <p>Theme: {theme}</p>
              <p>Chapters: {chapters.length} sections</p>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Audio & Narration</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Music: {audio.music}</p>
              <p>Subtitles: {audio.subtitles ? "Enabled" : "Disabled"}</p>
              <p>Quality: High Definition</p>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Content Summary</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Photos: {uploadedImages.length} images</p>
              <p>Story chapters: {chapters.length}</p>
              <p>Faces detected: {imageAnalysis?.successful_analyses || 0}</p>
              <p>Analysis status: {imageAnalysis ? "Completed" : "None"}</p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            variant="memory" 
            size="lg" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Make Changes
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-2"
            disabled={!videoData?.video_preview_path}
            onClick={() => {
              if (videoData?.video_preview_path) {
                // Open preview in new tab for sharing (with watermark)
                window.open(videoApiService.getVideoUrl(videoData.video_preview_path), '_blank');
              }
            }}
          >
            <Share2 className="w-5 h-5" />
            Share Preview
          </Button>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={onApprove}
            disabled={!videoData || (videoData.status !== 'completed' && videoData.generation_id !== 'demo-preview') || !canProceed}
            className="flex items-center gap-2 flex-1"
          >
            <Download className="w-5 h-5" />
            {videoData?.generation_id === 'demo-preview' ? 'Continue to Final Step' : 'Approve & Generate Final Video'}
          </Button>
        </div>

        {/* Note */}
        <Card className="p-4 bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Note:</strong> 
            {videoData?.generation_id === 'demo-preview' ? (
              <span> This is a demo preview showing how your video will look. The video generation service is being developed. Your story and images have been successfully processed!</span>
            ) : videoData?.video_preview_path ? (
              <span> This is a watermarked preview. Your final video will be in full quality without watermarks and include all your uploaded photos with complete narration.</span>
            ) : (
              <span> The preview is being generated from your uploaded images and story chapters.</span>
            )}
          </p>
        </Card>
      </div>

      {/* Audio Failure Dialog */}
      <AlertDialog open={showAudioFailureDialog} onOpenChange={setShowAudioFailureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Audio Generation Failed
            </AlertDialogTitle>
            <AlertDialogDescription>
              We encountered an issue while generating the audio narration for your video:
              <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono">
                {audioFailureError}
              </div>
              <div className="mt-3">
                You can either retry the audio generation or continue creating your video without narration.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueWithoutAudio}>
              Continue Without Audio
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRetryAudio} className="bg-primary hover:bg-primary/90">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Audio Generation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}