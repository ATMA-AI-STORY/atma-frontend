import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";
import { useState, useCallback } from "react";

interface UploadPhotosProps {
  onNext: (images: File[]) => void;
  onBack: () => void;
}

export default function UploadPhotos({ onNext, onBack }: UploadPhotosProps) {
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setUploading(true);
      setTimeout(() => {
        setImages(prev => [...prev, ...files]);
        setUploading(false);
      }, 1000);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploading(true);
      setTimeout(() => {
        setImages(prev => [...prev, ...files]);
        setUploading(false);
      }, 1000);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = images.length > 0;

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Upload Your <span className="bg-gradient-memory bg-clip-text text-transparent">Photos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Share the moments that matter most to you. We support JPG, PNG, and HEIC formats.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-muted hover:border-primary/50 hover:bg-primary/2'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-memory rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  Drop your photos here
                </h3>
                <p className="text-muted-foreground mb-6">
                  or click to browse your device
                </p>
                
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button variant="hero" size="lg" className="cursor-pointer">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Choose Photos
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Uploading photos...</span>
                <span className="text-sm text-primary font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}
        </Card>

        {/* Photo Grid */}
        {images.length > 0 && (
          <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setImages([])}
              >
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
            onClick={() => onNext(images)}
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