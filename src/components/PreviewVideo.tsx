import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, RotateCcw, Download, Share2, Volume2, VolumeX, Edit } from "lucide-react";
import { useState, useEffect } from "react";

interface PreviewVideoProps {
  onApprove: () => void;
  onBack: () => void;
}

export default function PreviewVideo({ onApprove, onBack }: PreviewVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const totalDuration = 245; // 4:05 in seconds

  // Simulate video generation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate video playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isGenerating) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isGenerating, totalDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!isGenerating) {
      setIsPlaying(!isPlaying);
    }
  };

  const restartVideo = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  if (isGenerating) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[500px]">
        <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-memory text-center max-w-md mx-auto">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gradient-memory rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Play className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">Creating Your Memory Video</h3>
            <p className="text-muted-foreground">
              We're weaving your photos and story together with beautiful transitions and music. This may take a few moments...
            </p>
            <Progress value={75} className="h-3" />
            <p className="text-sm text-muted-foreground">Processing photos and generating scenes...</p>
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

        {/* Video Player */}
        <Card className="p-8 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 rounded-lg overflow-hidden relative group">
            {/* Video Preview Placeholder */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white space-y-4">
                <div className="text-6xl font-light">📷</div>
                <p className="text-xl">Memory Video Preview</p>
                <p className="text-sm opacity-75">Classic Black & White Theme</p>
              </div>
            </div>

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

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1">
                  <Progress 
                    value={(currentTime / totalDuration) * 100} 
                    className="h-2 bg-white/20"
                  />
                </div>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restartVideo}
                  className="text-white hover:bg-white/20"
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
              <p>Duration: {formatTime(totalDuration)}</p>
              <p>Resolution: 1920x1080 (HD)</p>
              <p>Format: MP4</p>
              <p>Theme: Classic Black & White</p>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Audio</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Music: Gentle Piano Memories</p>
              <p>Voice: Sarah (Female, American)</p>
              <p>Subtitles: Enabled</p>
              <p>Quality: High Definition</p>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-3">Content</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Photos: 24 images</p>
              <p>Chapters: 5 sections</p>
              <p>Narration: Full story</p>
              <p>Transitions: Smooth fades</p>
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
            <Edit className="w-5 h-5" />
            Make Changes
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Preview
          </Button>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={onApprove}
            className="flex items-center gap-2 flex-1"
          >
            <Download className="w-5 h-5" />
            Approve & Generate Final Video
          </Button>
        </div>

        {/* Note */}
        <Card className="p-4 bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Note:</strong> This is a preview with sample content. Your final video will include all your uploaded photos and the complete narration.
          </p>
        </Card>
      </div>
    </div>
  );
}