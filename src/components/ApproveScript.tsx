import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Edit3, Plus, Check } from "lucide-react";
import { useState } from "react";

interface ApproveScriptProps {
  story: string;
  onNext: (script: string) => void;
  onBack: () => void;
}

export default function ApproveScript({ story, onNext, onBack }: ApproveScriptProps) {
  // Auto-generate a structured script from the user's story
  const [script] = useState(() => {
    const sections = [
      {
        title: "Early Life",
        content: "Born in 1975 in Lucknow, India, my journey began in a vibrant city filled with culture and warmth. These early years shaped who I would become, surrounded by family and the rich traditions of my homeland."
      },
      {
        title: "Education & Growth", 
        content: "In 1997, I graduated with an engineering degree, marking the completion of years of hard work and dedication. This achievement opened doors to new possibilities and set the foundation for my professional journey."
      },
      {
        title: "Love & Partnership",
        content: "In 2001, I married my college sweetheart, beginning a beautiful partnership that would carry me through life's adventures. Together, we built dreams and supported each other through every milestone."
      },
      {
        title: "New Beginnings",
        content: "2005 brought a major change when we moved to Canada, seeking new opportunities and adventures. This move required courage and faith, but it opened up a world of possibilities for our growing family."
      },
      {
        title: "Building Dreams",
        content: "By 2010, I had started my own business, turning years of experience into entrepreneurial success. This venture represented not just professional growth, but the realization of long-held dreams."
      }
    ];
    
    return sections;
  });

  const [editingSection, setEditingSection] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
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
                  Chapter {index + 1}: {section.title}
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
                    defaultValue={section.content}
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
                  {section.content}
                </p>
              )}
            </Card>
          ))}
          
          {/* Add New Section */}
          <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-soft border-dashed border-primary/30">
            <div className="text-center">
              <Button variant="outline" className="flex items-center gap-2">
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
            size="lg" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back & Edit Story
          </Button>
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => onNext(script.map(s => s.content).join(' '))}
            className="flex items-center gap-2"
          >
            Approve Script
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}