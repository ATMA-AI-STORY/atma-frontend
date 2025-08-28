import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Edit3, Plus, Check } from "lucide-react";
import { useState } from "react";
import type { Chapter } from "@/lib/api";

interface ApproveScriptProps {
  chapters: Chapter[];
  onNext: (script: string) => void;
  onBack: () => void;
}

export default function ApproveScript({ chapters, onNext, onBack }: ApproveScriptProps) {
  // Use chapters from props, with fallback to empty array
  const [script, setScript] = useState<Chapter[]>(() => {
    // If chapters are provided, use them; otherwise create default structure
    if (chapters && chapters.length > 0) {
      return chapters;
    }
    
    // Fallback structure if no chapters provided
    return [
      {
        title: "Chapter 1: Early Life",
        script: "This chapter will be generated from your story..."
      },
      {
        title: "Chapter 2: Growing Up", 
        script: "This chapter will explore your formative experiences..."
      }
    ];
  });

  const [editingSection, setEditingSection] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container  max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Story <span className="bg-gradient-memory bg-clip-text text-transparent">Script</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've crafted your narrative into a flowing story. Review and edit any sections before we create your video.
          </p>
        </div>

        {/* Script Content */}
        <div className="space-y-6 mb-8">
          {script.map((section, index) => (
            <Card key={index} className="p-6 bg-white/95 backdrop-blur-sm border-0 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {section.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(editingSection === index ? null : index)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              </div>
              
              {editingSection === index ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full p-4 border border-border rounded-lg resize-none min-h-[120px] text-base leading-relaxed"
                    defaultValue={section.script}
                    onChange={(e) => {
                      const newScript = [...script];
                      newScript[index] = { ...newScript[index], script: e.target.value };
                      setScript(newScript);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="hero" 
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground leading-relaxed text-lg">
                  {section.script}
                </p>
              )}
            </Card>
          ))}
          
          {/* Add New Section */}
          <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-soft border-dashed border-primary/30">
            <div className="text-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  const newChapter: Chapter = {
                    title: `Chapter ${script.length + 1}: New Chapter`,
                    script: "Add your chapter content here..."
                  };
                  setScript([...script, newChapter]);
                  setEditingSection(script.length);
                }}
              >
                <Plus className="w-4 h-4" />
                Add New Chapter
              </Button>
            </div>
          </Card>
        </div>

        {/* Script Summary */}
        <Card className="p-6 mb-8 bg-gradient-memory text-white border-0 shadow-memory">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Script Summary</h3>
            <p className="text-white/90">
              Your story contains {script.length} chapters and will create approximately a 3-4 minute memory video.
            </p>
          </div>
        </Card>

{/* Navigation */}
<div className="flex items-center justify-between">
  <Button 
    variant="memory" 
    size="default" 
    onClick={onBack}
    className="flex items-center gap-2 
               text-xs px-3 py-2   /* mobile */
               sm:text-sm sm:px-4 sm:py-2   /* small screens */
               md:text-base md:px-5 md:py-3"  /* desktop */
  >
    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
    Back & Edit Story
  </Button>
  
  <Button 
    variant="hero" 
    size="default" 
    onClick={() => onNext(script.map(s => s.script).join(' '))}
    className="flex items-center gap-2 
               text-xs px-3 py-2   /* mobile */
               sm:text-sm sm:px-4 sm:py-2   /* small screens */
               md:text-base md:px-5 md:py-3"  /* desktop */
  >
    Approve Script
    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
  </Button>
</div>
      </div>
    </div>
  );
}