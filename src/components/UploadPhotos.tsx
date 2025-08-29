import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { imageApiService, ImageUploadResponse, UploadProgress } from "@/lib/imageApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploadResponse?: ImageUploadResponse;
  uploadProgress?: UploadProgress;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadPhotosProps {
  onNext: (uploadedImages: ImageUploadResponse[]) => void;
  onBack: () => void;
  initialImages?: ImageUploadResponse[];
}

export default function UploadPhotos({ onNext, onBack, initialImages = [] }: UploadPhotosProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [existingImages, setExistingImages] = useState<ImageUploadResponse[]>(initialImages);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check authentication
  const checkAuth = useCallback(() => {
    if (!user) {
      console.warn('📋 UploadPhotos: User not authenticated, redirecting to login');
      navigate('/login');
      return false;
    }
    return true;
  }, [user, navigate]);

  // Load existing images from backend on component mount
  useEffect(() => {
    const loadExistingImages = async () => {
      if (!checkAuth()) return;
      
      try {
        const response = await imageApiService.listImages();
        // Convert ImageResponse to ImageUploadResponse by adding upload_url
        const convertedImages: ImageUploadResponse[] = response.images.map(img => ({
          id: img.id,
          filename: img.filename,
          original_filename: img.original_filename,
          file_size: img.file_size,
          mime_type: img.mime_type,
          width: img.width,
          height: img.height,
          processing_status: img.processing_status,
          metadata: img.metadata,
          upload_url: `/api/v1/images/${img.id}/file` // Construct the URL for accessing the image
        }));
        setExistingImages(convertedImages);
      } catch (error) {
        console.error('Failed to load existing images:', error);
      }
    };

    // If no initial images provided, load from backend
    if (initialImages.length === 0) {
      loadExistingImages();
    } else {
      setExistingImages(initialImages);
    }
  }, [checkAuth, initialImages]);

  // Delete existing image from backend
  const deleteExistingImage = async (imageId: string) => {
    if (!checkAuth()) return;
    
    try {
      await imageApiService.deleteImage(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      console.log(`✅ Image ${imageId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete image:', error);
      // You could add a toast notification here
    }
  };

  // Bulk delete all existing images
  const clearAllExistingImages = async () => {
    if (!confirm('Are you sure you want to delete all saved images? This cannot be undone.')) {
      return;
    }
    
    try {
      // Delete each image from backend
      for (const image of existingImages) {
        await imageApiService.deleteImage(image.id);
      }
      setExistingImages([]);
      console.log('✅ All saved images deleted successfully');
    } catch (error) {
      console.error('Failed to delete images:', error);
    }
  };

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
    
    if (!checkAuth()) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addFiles(files);
    }
  }, [checkAuth]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAuth()) return;
    
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      uploadStatus: 'pending'
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Start uploading immediately
    uploadFiles(newImages);
  };

  const uploadFiles = async (imagesToUpload: UploadedImage[]) => {
    if (!checkAuth()) return;

    setIsUploading(true);
    setOverallProgress(0);

    try {
      let completedUploads = 0;
      
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imageToUpload = imagesToUpload[i];
        
        // Update status to uploading
        setImages(prev => prev.map(img => 
          img.id === imageToUpload.id 
            ? { ...img, uploadStatus: 'uploading' as const }
            : img
        ));

        try {
          const uploadResponse = await imageApiService.uploadImage(
            imageToUpload.file,
            (progress) => {
              // Update individual file progress
              setImages(prev => prev.map(img => 
                img.id === imageToUpload.id 
                  ? { ...img, uploadProgress: progress }
                  : img
              ));
            }
          );

          // Update with successful upload response
          setImages(prev => prev.map(img => 
            img.id === imageToUpload.id 
              ? { 
                  ...img, 
                  uploadResponse,
                  uploadStatus: 'completed' as const,
                  id: uploadResponse.id // Update with server ID
                }
              : img
          ));

          completedUploads++;
          setOverallProgress((completedUploads / imagesToUpload.length) * 100);

        } catch (error) {
          console.error('❌ UploadPhotos: Failed to upload image:', error);
          
          // Update with error status
          setImages(prev => prev.map(img => 
            img.id === imageToUpload.id 
              ? { 
                  ...img, 
                  uploadStatus: 'failed' as const,
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : img
          ));
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    
    if (imageToRemove) {
      // Clean up preview URL
      URL.revokeObjectURL(imageToRemove.preview);
      
      // If image was successfully uploaded, delete from server
      if (imageToRemove.uploadResponse && imageToRemove.uploadStatus === 'completed') {
        try {
          await imageApiService.deleteImage(imageToRemove.uploadResponse.id);
          console.log('🗑️ UploadPhotos: Image deleted from server:', imageToRemove.uploadResponse.id);
        } catch (error) {
          console.error('❌ UploadPhotos: Failed to delete image from server:', error);
        }
      }
    }
    
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const clearAllImages = async () => {
    for (const image of images) {
      URL.revokeObjectURL(image.preview);
      
      if (image.uploadResponse && image.uploadStatus === 'completed') {
        try {
          await imageApiService.deleteImage(image.uploadResponse.id);
        } catch (error) {
          console.error('❌ UploadPhotos: Failed to delete image from server:', error);
        }
      }
    }
    
    setImages([]);
  };

  const getCompletedUploads = (): ImageUploadResponse[] => {
    // Combine existing images with newly uploaded ones
    const newlyUploaded = images
      .filter(img => img.uploadStatus === 'completed' && img.uploadResponse)
      .map(img => img.uploadResponse!);
    
    return [...existingImages, ...newlyUploaded];
  };

  const getImageStatusIcon = (image: UploadedImage) => {
    switch (image.uploadStatus) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const canProceed = (existingImages.length > 0 || (images.length > 0 && images.some(img => img.uploadStatus === 'completed'))) && !isUploading;

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
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Choose Photos
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Uploading photos...</span>
                <span className="text-sm text-primary font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </Card>

        {/* Photo Grid */}
        {(images.length > 0 || existingImages.length > 0) && (
          <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                {existingImages.length + images.length} photo{(existingImages.length + images.length) !== 1 ? 's' : ''} selected
              </h3>
              <div className="flex gap-2">
                {existingImages.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllExistingImages}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Clear Saved Images
                  </Button>
                )}
                {images.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllImages}
                    disabled={isUploading}
                  >
                    Clear New Uploads
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Existing Images */}
              {existingImages.map((image, index) => (
                <div key={`existing-${image.id}`} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${image.upload_url}`}
                      alt={image.original_filename}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status indicator */}
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    
                    {/* Existing image label */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Saved
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button for existing images */}
                  <button
                    onClick={() => deleteExistingImage(image.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/80"
                    title="Delete this image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="truncate" title={image.original_filename}>
                      {image.original_filename}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* New Images */}
              {images.map((image, index) => (
                <div key={`new-${image.id}`} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload status overlay */}
                    <div className="absolute top-2 left-2">
                      {getImageStatusIcon(image)}
                    </div>
                    
                    {/* Progress overlay for uploading images */}
                    {image.uploadStatus === 'uploading' && image.uploadProgress && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <div className="text-xs text-white mb-1">{image.uploadProgress.percentage}%</div>
                        <Progress value={image.uploadProgress.percentage} className="h-1" />
                      </div>
                    )}
                    
                    {/* Error message */}
                    {image.uploadStatus === 'failed' && image.error && (
                      <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 p-1">
                        <div className="text-xs text-white truncate" title={image.error}>
                          {image.error}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeImage(image.id)}
                    disabled={image.uploadStatus === 'uploading'}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
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
            onClick={() => onNext(getCompletedUploads())}
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            Continue ({getCompletedUploads().length} images)
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}