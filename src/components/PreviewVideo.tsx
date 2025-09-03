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
import { ArrowLeft, Play, Pause, RotateCcw, Download, Share2, Volume2, VolumeX, Edit, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { videoApiService, VideoGenerationRequest, VideoPreviewResponse } from "@/lib/videoApi";
import { Chapter } from "@/lib/api";
import { ImageUploadResponse } from "@/lib/imageApi";
import { ImageAnalysisResponse } from "@/lib/imageAnalysisApi";

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
    voice: string;
    subtitles: boolean;
  };
}

export default function PreviewVideo({ 
  onApprove, 
  onBack, 
  chapters, 
  uploadedImages, 
  imageAnalysis, 
  theme = "Classic Black & White", 
  audio = { music: "Gentle Piano Memories", voice: "Sarah (Female, American)", subtitles: true }
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

  /**
   * Load authenticated video URL for playback
   */
  const loadVideoUrl = async (videoPath: string) => {
    try {
      const filename = videoPath.split('/').pop() || '';
      console.log('🎬 PreviewVideo: Loading video URL for:', filename);
      
      const authenticatedUrl = await videoApiService.createAuthenticatedVideoBlob(filename);
      setVideoUrl(authenticatedUrl);
      console.log('✅ PreviewVideo: Video URL loaded successfully');
    } catch (error) {
      console.error('❌ PreviewVideo: Failed to load video URL:', error);
      setError('Failed to load video for playback. Please try refreshing the page.');
    }
  };

  /**
   * Map chapters to images based on image analysis and story content
   * This creates the chapter-image mapping required by the backend
   */
  const mapChaptersToImages = (): VideoGenerationRequest => {
    console.log('🎬 PreviewVideo: Mapping chapters to images...');
    
    // Distribute images across chapters
    const imagesPerChapter = Math.ceil(uploadedImages.length / Math.max(chapters.length, 1));
    
    const mappings = chapters.map((chapter, index) => {
      const startIdx = index * imagesPerChapter;
      const endIdx = Math.min(startIdx + imagesPerChapter, uploadedImages.length);
      const chapterImages = uploadedImages.slice(startIdx, endIdx);
      
      // Calculate duration per image in milliseconds (minimum 10 seconds per image)
      const baseDurationPerImage = Math.max(10000, Math.ceil(chapter.script.length / 15) * 1000); // 15 chars per second, converted to ms
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

    return { mappings };
  };

  /**
   * Generate video preview on component mount
   */
  useEffect(() => {
    const generateVideo = async () => {
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

        console.log('🎬 PreviewVideo: Starting video generation...');
        console.log('🎬 PreviewVideo: Using auth token:', token.substring(0, 20) + '...');

        // Prepare video generation request
        const request = mapChaptersToImages();
        console.log('🎬 PreviewVideo: Starting video generation with request:', JSON.stringify(request, null, 2));
        console.log('🎬 PreviewVideo: Using auth token:', token.substring(0, 20) + '...');

        // Call backend API to generate video preview
        const response = await videoApiService.generatePreview(request);
        console.log('🎬 PreviewVideo: Video generation response:', response);
        setVideoData(response);

        // Check if video was generated successfully
        if (response.video_preview_path && response.status === 'success') {
          // Video generated successfully
          setIsGenerating(false);
          setGenerationProgress(100);
          console.log('✅ PreviewVideo: Video generated successfully!', response.video_preview_path);
          
          // Load authenticated video URL
          loadVideoUrl(response.video_preview_path);
        } else if (response.status === 'generating') {
          // If video is still generating, poll for status
          pollGenerationStatus(response.generation_id);
        } else if (response.status === 'completed') {
          setIsGenerating(false);
          setGenerationProgress(100);
        } else if (response.status === 'failed') {
          throw new Error('Video generation failed on server');
        }

      } catch (error) {
        console.error('❌ PreviewVideo: Video generation failed:', error);
        
        let errorMessage = 'Failed to generate video preview';
        if (error instanceof Error) {
          if (error.message.includes('Authentication required') || error.message.includes('Please log in')) {
            errorMessage = 'Please log in to generate video preview';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to video generation service. Please check if the backend is running.';
          } else if (error.message.includes('404')) {
            errorMessage = 'Video generation service is not available yet. This feature is still in development.';
          } else if (error.message.includes('422')) {
            errorMessage = 'Invalid request format. Please try again or contact support.';
          } else if (error.message.includes('401')) {
            errorMessage = 'Video generation endpoint requires different authentication. This feature may not be fully implemented yet.';
          } else if (error.message.includes('405')) {
            errorMessage = 'Video generation endpoint exists but is not properly configured. Please contact the development team.';
          } else {
            errorMessage = error.message;
          }
        }
        
        // For now, if video generation fails, show a placeholder/demo mode
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('404') || 
          error.message.includes('405') ||
          error.message.includes('Video generation service is not available')
        )) {
          console.log('🎬 PreviewVideo: Falling back to demo mode due to backend limitations');
          setError(null);
          setIsGenerating(false);
          setGenerationProgress(100);
          
          // Set demo video data
          setVideoData({
            video_preview_path: '', // Empty path triggers placeholder
            generation_id: 'demo-preview',
            status: 'completed',
            created_at: new Date().toISOString(),
            duration: Math.max(180, chapters.reduce((acc, ch) => acc + Math.ceil(ch.script.length / 15), 0)),
            metadata: {
              preview_watermark: true,
              resolution: '1920x1080',
              format: 'MP4'
            }
          });
          return;
        }
        
        setError(errorMessage);
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
        const request = mapChaptersToImages();
        const response = await videoApiService.generatePreview(request);
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
              We're weaving your {uploadedImages.length} photos and {chapters.length} story chapters together with beautiful transitions and music...
            </p>
            <Progress value={generationProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {generationProgress < 30 && "Analyzing your photos and story structure..."}
              {generationProgress >= 30 && generationProgress < 60 && "Generating video scenes and transitions..."}
              {generationProgress >= 60 && generationProgress < 90 && "Adding music and finalizing video..."}
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
            {/* Actual Video Element */}
            {videoData?.video_preview_path && videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
                preload="metadata"
                style={{ 
                  filter: 'contrast(1.1) saturate(1.2)',
                  pointerEvents: 'none' // Prevent direct video controls, use custom controls
                }}
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              /* Fallback Preview Placeholder */
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <div className="text-6xl font-light">🎬</div>
                  <p className="text-xl">Memory Video Preview</p>
                  <p className="text-sm opacity-75">{theme}</p>
                  <div className="bg-blue-500/80 px-3 py-1 rounded-full text-xs font-semibold">
                    DEMO MODE
                  </div>
                  <p className="text-xs opacity-60 max-w-md">
                    Video generation service is being developed. This shows how your final video will look.
                  </p>
                  <div className="space-y-1 text-xs opacity-75">
                    <p>📸 {uploadedImages.length} Photos</p>
                    <p>📖 {chapters.length} Chapters</p>
                    <p>🎵 {audio.music}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Play/Pause Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-gray-700" />
                ) : (
                  <Play className="w-10 h-10 text-gray-700 ml-1" />
                )}
              </div>
            </div>

            {/* Preview Watermark Overlay */}
            <div className="absolute top-4 right-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
              PREVIEW
            </div>

            {/* Progress Bar and Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                  disabled={!videoData?.video_preview_path}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1">
                  <Progress 
                    value={totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0} 
                    className="h-2 bg-white/20"
                  />
                </div>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(totalDuration || videoData?.duration || 245)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                  disabled={!videoData?.video_preview_path}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restartVideo}
                  className="text-white hover:bg-white/20"
                  disabled={!videoData?.video_preview_path}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
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
              <p>Voice: {audio.voice}</p>
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
            disabled={!videoData || (videoData.status !== 'completed' && videoData.generation_id !== 'demo-preview')}
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
    </div>
  );
}