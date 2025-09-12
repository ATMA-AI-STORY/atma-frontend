import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, Check } from "lucide-react";
import { useState } from "react";

interface ChooseThemeProps {
  onNext: (theme: string) => void;
  onBack: () => void;
  canProceed?: boolean;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  style: string;
}

export default function ChooseTheme({ onNext, onBack, canProceed = true }: ChooseThemeProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('documentary');

  const themes: Theme[] = [
    {
      id: 'documentary',
      name: 'Documentary Style',
      description: 'Professional storytelling with cinematic transitions and thoughtful pacing',
      preview: 'bg-gradient-to-br from-gray-800 via-slate-600 to-gray-400',
      style: 'Professional, cinematic, thoughtful'
    },
    {
      id: 'classic',
      name: 'Classic Black & White',
      description: 'Coming soon - Timeless elegance with vintage photo effects',
      preview: 'bg-gradient-to-br from-gray-900 via-gray-600 to-gray-300',
      style: 'Elegant, nostalgic, sophisticated'
    },
    {
      id: 'warm',
      name: 'Soft Pastel Memories',
      description: 'Coming soon - Warm, dreamy colors that evoke comfort and happiness',
      preview: 'bg-gradient-to-br from-pink-200 via-orange-100 to-purple-200',
      style: 'Warm, comforting, dreamy'
    },
    {
      id: 'modern',
      name: 'Modern Slideshow',
      description: 'Coming soon - Clean, contemporary design with smooth animations',
      preview: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500',
      style: 'Contemporary, vibrant, dynamic'
    },
    {
      id: 'cinematic',
      name: 'Cinematic Journey',
      description: 'Coming soon - Dramatic storytelling with movie-like transitions',
      preview: 'bg-gradient-to-br from-amber-600 via-red-600 to-black',
      style: 'Dramatic, cinematic, powerful'
    },
    {
      id: 'nature',
      name: 'Nature Inspired',
      description: 'Coming soon - Earth tones and organic transitions inspired by nature',
      preview: 'bg-gradient-to-br from-green-600 via-emerald-400 to-teal-300',
      style: 'Natural, organic, peaceful'
    }
  ];

  const hasSelectedTheme = selectedTheme !== '';

  return (
    <div className="p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="bg-gradient-memory bg-clip-text text-transparent">Visual Theme</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a visual style that matches the mood and tone of your story.
          </p>
        </div>

        {/* Theme Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {themes.map((theme) => {
            const isAvailable = theme.id === 'documentary';
            return (
              <Card 
                key={theme.id}
                className={`p-6 transition-all duration-300 border-2 ${
                  !isAvailable 
                    ? 'opacity-60 cursor-not-allowed border-gray-300 bg-gray-50' 
                    : selectedTheme === theme.id 
                      ? 'border-primary shadow-memory bg-white cursor-pointer' 
                      : 'border-transparent bg-white/95 hover:bg-white hover:shadow-card cursor-pointer'
                }`}
                onClick={() => isAvailable && setSelectedTheme(theme.id)}
              >
                {/* Theme Preview */}
                <div className="relative mb-4 rounded-lg overflow-hidden">
                  <div className={`h-32 ${theme.preview} relative`}>
                    {/* Preview Animation Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-700 ml-1" />
                      </div>
                    </div>
                    
                    {/* Selected Check Mark */}
                    {selectedTheme === theme.id && isAvailable && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Coming Soon Badge */}
                    {!isAvailable && (
                      <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {theme.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {theme.description}
                  </p>
                  <div className="text-xs text-primary font-medium">
                    Style: {theme.style}
                  </div>
                  
                  {/* Preview Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center gap-2"
                    disabled={!isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAvailable) {
                        // Future: Show theme preview
                      }
                    }}
                  >
                    <Play className="w-4 h-4" />
                    {isAvailable ? 'Preview Theme' : 'Coming Soon'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Selected Theme Summary */}
        {selectedTheme && (
          <Card className="p-6 mb-8 bg-gradient-memory text-white border-0 shadow-memory">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Selected Theme</h3>
              <p className="text-white/90">
                {themes.find(t => t.id === selectedTheme)?.name} - {themes.find(t => t.id === selectedTheme)?.description}
              </p>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="memory" 
            size="lg" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => onNext(selectedTheme)}
            disabled={!hasSelectedTheme || !canProceed}
            className="flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}