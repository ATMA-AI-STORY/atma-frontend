import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Play, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/hero-background.jpg";

interface WelcomeProps {
  onCreateNew: () => void;
  onViewPast: () => void;
}

export default function Welcome({ onCreateNew, onViewPast }: WelcomeProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-warm relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Header with user info and logout */}
      <header className="relative z-20 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-foreground">ATMA</h2>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="bg-white/90 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Bring Your Story
            <span className="bg-gradient-memory bg-clip-text text-transparent"> to Life</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            Upload your photos, tell your story, and we'll turn it into a timeless memory video that preserves your precious moments forever.
          </p>
          
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            {/* Create New Memory */}
            <Card className="p-8 bg-white/95 backdrop-blur-sm border-0 shadow-card hover:shadow-memory transition-all duration-300 cursor-pointer group" 
                  onClick={onCreateNew}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-memory rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Create New Memory</h3>
                <p className="text-muted-foreground">Start with your photos and create something beautiful</p>
                <Button variant="hero" size="lg" className="w-full mt-4">
                  Get Started
                </Button>
              </div>
            </Card>
            
            {/* View Past Videos */}
            <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer group"
                  onClick={onViewPast}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">My Memory Library</h3>
                <p className="text-muted-foreground">View and share your previous video memories</p>
                <Button variant="memory" size="lg" className="w-full mt-4">
                  View Library
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Inspiration Text */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground italic">
              "Every photo tells a story. Let us help you tell yours."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}