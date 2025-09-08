import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerMuteButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange
} from "@/components/ui/video-player";
import { ArrowLeft, Play, Share2, Download, Plus, Calendar, Clock, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { videoApiService, type UserVideo } from "@/lib/videoApi";
import { useAuth } from "@/contexts/AuthContext";

interface VideoLibraryProps {
  onBack: () => void;
  onCreateNew: () => void;
}

interface VideoCardProps {
  video: UserVideo;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
  isDeleting: boolean;
  formatDate: (timestamp: number) => string;
  formatFileSize: (bytes: number) => string;
}

// Video Card Component
function VideoCard({ video, onDownload, onDelete, isDeleting, formatDate, formatFileSize }: VideoCardProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Extract readable title from filename
  const getVideoTitle = (filename: string): string => {
    // Remove extension and prefix, then format nicely
    return filename
      .replace(/^video_preview_/, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .slice(0, -2) // Remove user ID and timestamp
      .join(' ') || 'Generated Video';
  };

  // Load video for preview
  const loadVideoPreview = async () => {
    if (videoSrc) return; // Already loaded

    try {
      setLoadingVideo(true);
      const blobUrl = await videoApiService.createAuthenticatedVideoBlob(video.filename);
      setVideoSrc(blobUrl);
    } catch (error) {
      console.error('Failed to load video preview:', error);
    } finally {
      setLoadingVideo(false);
    }
  };

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card hover:shadow-memory transition-all duration-300 group">
      {/* Video Preview */}
      <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 rounded-lg overflow-hidden relative mb-4">
        {videoSrc ? (
          <VideoPlayer className="w-full h-full">
            <VideoPlayerContent
              src={videoSrc}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <VideoPlayerControlBar>
              <VideoPlayerPlayButton />
              <VideoPlayerTimeRange />
              <VideoPlayerTimeDisplay />
              <VideoPlayerMuteButton />
              <VideoPlayerVolumeRange />
            </VideoPlayerControlBar>
          </VideoPlayer>
        ) : (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer" onClick={loadVideoPreview}>
            <div className="text-center text-white space-y-2">
              {loadingVideo ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              ) : (
                <>
                  <div className="text-4xl">🎬</div>
                  <div className="text-xs bg-black/50 px-2 py-1 rounded">
                    {formatFileSize(video.file_size)}
                  </div>
                </>
              )}
            </div>
            
            {/* Play Button Overlay */}
            {!loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-gray-700 ml-1" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground truncate" title={getVideoTitle(video.filename)}>
          {getVideoTitle(video.filename)}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(video.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatFileSize(video.file_size)}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono truncate" title={video.filename}>
          {video.filename}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="hero" 
            size="sm" 
            className="flex-1"
            onClick={loadVideoPreview}
            disabled={loadingVideo}
          >
            <Play className="w-4 h-4 mr-2" />
            {loadingVideo ? 'Loading...' : 'Watch'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDownload(video.filename)}
            title="Download video"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(video.filename)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete video"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function VideoLibrary({ onBack, onCreateNew }: VideoLibraryProps) {
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch user videos from backend
  const fetchVideos = async () => {
    if (!isAuthenticated) {
      setError('Please log in to view your videos');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await videoApiService.listUserVideos();
      setVideos(response.videos);
      console.log('📹 VideoLibrary: Loaded', response.videos.length, 'videos');
    } catch (err) {
      console.error('❌ VideoLibrary: Failed to fetch videos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Download video
  const handleDownload = async (filename: string) => {
    try {
      await videoApiService.downloadVideo(filename);
    } catch (err) {
      console.error('❌ VideoLibrary: Download failed:', err);
      alert(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete video with confirmation
  const handleDelete = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingVideo(filename);
      await videoApiService.deleteVideo(filename);
      // Refresh the video list
      await fetchVideos();
    } catch (err) {
      console.error('❌ VideoLibrary: Delete failed:', err);
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeletingVideo(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format creation date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Calculate total statistics
  const totalSize = videos.reduce((acc, video) => acc + video.file_size, 0);
  const totalVideos = videos.length;

  useEffect(() => {
    fetchVideos();
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-lg text-muted-foreground">Loading your video library...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="p-8 bg-white/95 backdrop-blur-sm border-0 shadow-card text-center max-w-md">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Unable to Load Videos</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={fetchVideos}>
                  Try Again
                </Button>
                <Button variant="hero" onClick={onBack}>
                  Go Back
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              My Memory <span className="bg-gradient-memory bg-clip-text text-transparent">Library</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Your collection of beautiful memory videos, ready to watch and share.
            </p>
          </div>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={onCreateNew}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New
          </Button>
        </div>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {videos.map((video) => (
              <VideoCard
                key={video.filename}
                video={video}
                onDownload={handleDownload}
                onDelete={handleDelete}
                isDeleting={deletingVideo === video.filename}
                formatDate={formatDate}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-card text-center mb-8">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Play className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">No videos yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start creating your first memory video by uploading photos and sharing your story.
              </p>
              <Button variant="hero" size="lg" onClick={onCreateNew}>
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Memory
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft text-center">
            <h3 className="text-3xl font-bold text-foreground">{totalVideos}</h3>
            <p className="text-muted-foreground">Memory Videos</p>
          </Card>
          
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft text-center">
            <h3 className="text-3xl font-bold text-foreground">
              {formatFileSize(totalSize)}
            </h3>
            <p className="text-muted-foreground">Total Storage</p>
          </Card>
          
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft text-center">
            <h3 className="text-3xl font-bold text-foreground">
              {videos.length > 0 ? formatDate(Math.max(...videos.map(v => v.created_at))) : 'None'}
            </h3>
            <p className="text-muted-foreground">Latest Video</p>
          </Card>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            variant="memory" 
            size="lg" 
            onClick={onBack}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}