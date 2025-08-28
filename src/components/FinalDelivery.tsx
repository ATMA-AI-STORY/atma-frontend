import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Share2, Mail, Copy, CheckCircle, Home, Play } from "lucide-react";
import { useState, useEffect } from "react";

interface FinalDeliveryProps {
  onStartOver: () => void;
}

export default function FinalDelivery({ onStartOver }: FinalDeliveryProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Simulate video processing
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsProcessing(false);
          setIsComplete(true);
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://atma.app/share/your-memory-video-abc123');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareUrl = 'https://atma.app/share/your-memory-video-abc123';

  if (isProcessing) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[500px]">
        <Card className="p-12 bg-white/95 backdrop-blur-sm border-0 shadow-memory text-center max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-gradient-memory rounded-full flex items-center justify-center mx-auto">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            
            <h3 className="text-3xl font-semibold text-foreground">Creating Your Final Video</h3>
            <p className="text-muted-foreground text-lg">
              We're putting the finishing touches on your memory video. This is where the magic happens!
            </p>
            
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {progress < 30 && "Preparing high-resolution images..."}
                {progress >= 30 && progress < 60 && "Synchronizing audio and visuals..."}
                {progress >= 60 && progress < 90 && "Applying final touches and effects..."}
                {progress >= 90 && "Almost ready! Finalizing your video..."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-memory rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
            Your Video is <span className="bg-gradient-memory bg-clip-text text-transparent">Ready!</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Your beautiful memory video has been created and is ready to share with the world.
          </p>
        </div>

        {/* Video Preview Card */}
        <Card className="p-8 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 rounded-lg overflow-hidden relative mb-6">
            {/* Thumbnail */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white space-y-4">
                <div className="text-6xl">🎬</div>
                <p className="text-2xl font-medium">My Life Story</p>
                <p className="text-sm opacity-75">4:05 • HD Quality</p>
              </div>
            </div>
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-gray-700 ml-1" />
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">My Life Story</h3>
            <p className="text-muted-foreground">Created on {new Date().toLocaleDateString()}</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Download */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-memory rounded-2xl flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Download Video</h3>
              <p className="text-muted-foreground">
                Save the high-quality MP4 file to your device
              </p>
              <Button variant="hero" size="lg" className="w-full">
                <Download className="w-5 h-5 mr-2" />
                Download MP4 (HD)
              </Button>
            </div>
          </Card>

          {/* Share */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto">
                <Share2 className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Share Your Story</h3>
              <p className="text-muted-foreground">
                Send a private link to family and friends
              </p>
              <div className="space-y-2">
                <Button 
                  variant="memory" 
                  size="lg" 
                  className="w-full"
                  onClick={handleCopyLink}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Share Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

       {/* Sharing Options */}
<Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-soft">
  <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Quick Share Options</h3>
  <div className="flex flex-wrap justify-center gap-2">
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 text-xs px-2 py-1"
    >
      <Mail className="w-3 h-3" />
      Email
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 text-xs px-2 py-1"
    >
      📱 Text
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 text-xs px-2 py-1"
    >
      📘 Facebook
    </Button>
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 text-xs px-2 py-1"
    >
      📧 WhatsApp
    </Button>
  </div>
</Card>

        {/* Video Details */}
        <Card className="p-6 mb-8 bg-gradient-memory text-white border-0 shadow-memory">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="font-semibold mb-2">Video Quality</h4>
              <p className="text-white/90">1920x1080 HD</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Duration</h4>
              <p className="text-white/90">4 minutes 5 seconds</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Photos Used</h4>
              <p className="text-white/90">24 memories</p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            variant="memory" 
            size="lg" 
            onClick={onStartOver}
            className="flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" />
            Create Another Memory
          </Button>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground italic">
            "Thank you for trusting us with your precious memories. We hope this video brings joy for years to come."
          </p>
        </div>
      </div>
    </div>
  );
}