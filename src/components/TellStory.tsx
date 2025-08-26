import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, PenTool, Mic, Lightbulb } from "lucide-react";
import { useState } from "react";

interface TellStoryProps {
  onNext: (story: string) => void;
  onBack: () => void;
}

export default function TellStory({ onNext, onBack }: TellStoryProps) {
  const [story, setStory] = useState("");
  const [mode, setMode] = useState<'write' | 'speak'>('write');

  const promptSuggestions = [
    "Born in [year] in [city]",
    "Graduated from [school] in [year]", 
    "Married [partner name] in [year]",
    "Moved to [city] in [year]",
    "Career highlights and achievements",
    "Travels and adventures",
    "Family milestones and celebrations",
    "Hobbies and passions"
  ];

  const canProceed = story.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tell Your <span className="bg-gradient-memory bg-clip-text text-transparent">Story</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Share the key moments, milestones, and memories that define your journey.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-4 mb-8 justify-center">
          <Button
            variant={mode === 'write' ? 'hero' : 'memory'}
            size="lg"
            onClick={() => setMode('write')}
            className="flex items-center gap-2"
          >
            <PenTool className="w-5 h-5" />
            Write Key Points
          </Button>
          <Button
            variant={mode === 'speak' ? 'hero' : 'memory'}
            size="lg"
            onClick={() => setMode('speak')}
            className="flex items-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Speak Your Story
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Coming Soon</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Input Area */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card h-full">
              {mode === 'write' ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <PenTool className="w-5 h-5" />
                    Write About Your Life Events
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Tell us about your journey. You can write in bullet points or paragraphs - whatever feels natural.
                  </p>
                  <Textarea
                    placeholder="Share your story here... For example:
• Born in 1975 in Lucknow, India
• Graduated with engineering degree in 1997
• Married my college sweetheart in 2001
• Moved to Canada in 2005 for new opportunities
• Started my own business in 2010
• Had two wonderful children..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="min-h-[400px] resize-none text-base leading-relaxed"
                  />
                  <div className="text-sm text-muted-foreground">
                    {story.trim().length} characters
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Record Your Story
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-memory rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-muted-foreground">
                      Voice recording feature coming soon!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      For now, please use the "Write Key Points" option to share your story.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Suggestions Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" />
                Ideas to Get Started
              </h3>
              <div className="space-y-3">
                {promptSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      if (mode === 'write') {
                        setStory(prev => prev + (prev ? '\n• ' : '• ') + suggestion);
                      }
                    }}
                  >
                    • {suggestion}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Click any suggestion to add it to your story, then customize it with your details.
                </p>
              </div>
            </Card>
          </div>
        </div>

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
            onClick={() => onNext(story)}
            disabled={!canProceed}
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