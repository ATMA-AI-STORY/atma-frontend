// UploadPhotos.tsx

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import {
  imageApiService,
  ImageUploadResponse,
  UploadProgress,
} from "@/lib/imageApi";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploadResponse?: ImageUploadResponse;
  uploadProgress?: UploadProgress;
  uploadStatus: "pending" | "uploading" | "completed" | "failed";
  error?: string;
}

interface UploadPhotosProps {
  onNext: (uploadedImages: ImageUploadResponse[]) => void | Promise<void>;
  onBack: () => void;
  initialImages?: ImageUploadResponse[];
  isProcessing?: boolean;
}

export default function UploadPhotos({ onNext, onBack, initialImages = [], isProcessing = false }: UploadPhotosProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [existingImages, setExistingImages] = useState<ImageUploadResponse[]>(initialImages);
  const [showAnalyzing, setShowAnalyzing] = useState(false); // NEW: controls loader timing
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🔹 Trigger loader for 2–3s only when isProcessing starts
  useEffect(() => {
    if (isProcessing) {
      setShowAnalyzing(true);
      const timer = setTimeout(() => {
        setShowAnalyzing(false);
      }, 2500); // show loader for ~2.5s
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  // Check authentication
  const checkAuth = useCallback(() => {
    if (!user) {
      console.warn("📋 UploadPhotos: User not authenticated, redirecting to login");
      navigate("/login");
      return false;
    }
    return true;
  }, [user, navigate]);

  // Load existing images
  useEffect(() => {
    const loadExistingImages = async () => {
      if (!checkAuth()) return;

      try {
        const response = await imageApiService.listImages();
        const convertedImages: ImageUploadResponse[] = response.images.map((img) => ({
          ...img,
          upload_url: `/api/v1/images/${img.id}/file`,
        }));
        setExistingImages(convertedImages);
      } catch (error) {
        console.error("Failed to load existing images:", error);
      }
    };

    if (initialImages.length === 0) {
      loadExistingImages();
    } else {
      setExistingImages(initialImages);
    }
  }, [checkAuth, initialImages]);

  // Delete existing image
  const deleteExistingImage = async (imageId: string) => {
    if (!checkAuth()) return;
    try {
      await imageApiService.deleteImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  // Drag/drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (!checkAuth()) return;
      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
      if (files.length > 0) addFiles(files);
    },
    [checkAuth]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkAuth()) return;
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      uploadStatus: "pending",
    }));
    setImages((prev) => [...prev, ...newImages]);
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
        setImages((prev) =>
          prev.map((img) => (img.id === imageToUpload.id ? { ...img, uploadStatus: "uploading" } : img))
        );

        try {
          const uploadResponse = await imageApiService.uploadImage(imageToUpload.file, (progress) => {
            setImages((prev) =>
              prev.map((img) => (img.id === imageToUpload.id ? { ...img, uploadProgress: progress } : img))
            );
          });

          setImages((prev) =>
            prev.map((img) =>
              img.id === imageToUpload.id
                ? { ...img, uploadResponse, uploadStatus: "completed", id: uploadResponse.id }
                : img
            )
          );
          completedUploads++;
          setOverallProgress((completedUploads / imagesToUpload.length) * 100);
        } catch (error) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === imageToUpload.id
                ? { ...img, uploadStatus: "failed", error: error instanceof Error ? error.message : "Upload failed" }
                : img
            )
          );
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getCompletedUploads = (): ImageUploadResponse[] => {
    const newlyUploaded = images
      .filter((img) => img.uploadStatus === "completed" && img.uploadResponse)
      .map((img) => img.uploadResponse!);
    return [...existingImages, ...newlyUploaded];
  };

  const canProceed =
    (existingImages.length > 0 || (images.length > 0 && images.some((img) => img.uploadStatus === "completed"))) &&
    !isUploading &&
    !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-warm p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Analyzing Indicator (shows only 2-3s) */}
        {showAnalyzing && (
          <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Your Images</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is analyzing faces, objects, and emotions in your photos...
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Photos Grid */}
        {(images.length > 0 || existingImages.length > 0) && (
          <Card className="p-6 mb-8 bg-white/95 backdrop-blur-sm border-0 shadow-card">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {existingImages.map((image) => (
                <div key={`existing-${image.id}`} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}${image.upload_url}`}
                      alt={image.original_filename}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")} // HIDE broken thumbnails
                    />
                  </div>
                </div>
              ))}

              {images.map((image, index) => (
                <div key={`new-${image.id}`} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")} // HIDE broken thumbnails
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="memory" size="lg" onClick={onBack} className="flex items-center gap-2">
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
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Images...
              </>
            ) : (
              <>
                Continue ({getCompletedUploads().length} images)
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
