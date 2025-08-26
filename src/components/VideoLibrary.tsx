import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Share2, Download, Plus, Calendar, Clock } from "lucide-react";

interface VideoLibraryProps {
  onBack: () => void;
  onCreateNew: () => void;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  createdDate: string;
  views: number;
}

export default function VideoLibrary({ onBack, onCreateNew }: VideoLibraryProps) {
  const videos: Video[] = [
    {
      id: '1',
      title: 'My Life Story',
      thumbnail: '🎬',
      duration: '4:05',
      createdDate: 'Today',
      views: 12
    },
    {
      id: '2', 
      title: 'Family Vacation Memories',
      thumbnail: '🏖️',
      duration: '3:24',
      createdDate: '2 days ago',
      views: 8
    },
    {
      id: '3',
      title: 'Wedding Anniversary',
      thumbnail: '💒',
      duration: '5:12',
      createdDate: '1 week ago',
      views: 25
    },
    {
      id: '4',
      title: 'Childhood Adventures',
      thumbnail: '🎈',
      duration: '2:48',
      createdDate: '2 weeks ago', 
      views: 15
    }
  ];

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
              <Card key={video.id} className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card hover:shadow-memory transition-all duration-300 group">
                {/* Video Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300 rounded-lg overflow-hidden relative mb-4 cursor-pointer">
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-center text-white space-y-2">
                      <div className="text-4xl">{video.thumbnail}</div>
                      <div className="text-xs bg-black/50 px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                  </div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-700 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{video.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {video.createdDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {video.duration}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {video.views} view{video.views !== 1 ? 's' : ''}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="hero" size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Watch
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
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
            <h3 className="text-3xl font-bold text-foreground">{videos.length}</h3>
            <p className="text-muted-foreground">Memory Videos</p>
          </Card>
          
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft text-center">
            <h3 className="text-3xl font-bold text-foreground">
              {videos.reduce((acc, video) => acc + video.views, 0)}
            </h3>
            <p className="text-muted-foreground">Total Views</p>
          </Card>
          
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-soft text-center">
            <h3 className="text-3xl font-bold text-foreground">15:29</h3>
            <p className="text-muted-foreground">Total Runtime</p>
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