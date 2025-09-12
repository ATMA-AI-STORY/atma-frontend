import { useState } from "react";
import Welcome from "@/components/Welcome";
import UploadPhotos from "@/components/UploadPhotos";
import TellStory from "@/components/TellStory";
import ApproveScript from "@/components/ApproveScript";
import ChooseTheme from "@/components/ChooseTheme";
import ChooseAudio from "@/components/ChooseAudio";
import PreviewVideo from "@/components/PreviewVideo";
import FinalDelivery from "@/components/FinalDelivery";
import VideoLibrary from "@/components/VideoLibrary";
import StepProgress from "@/components/StepProgress";
import { apiService, type Chapter } from "@/lib/api";
import { ImageUploadResponse } from "@/lib/imageApi";
import { imageAnalysisApiService, ImageAnalysisResponse } from "@/lib/imageAnalysisApi";
import { videoApiService } from "@/lib/videoApi";
import { Voice } from "@/lib/audioApi";
import { useToast } from "@/hooks/use-toast";

type Step = 'welcome' | 'upload' | 'story' | 'script' | 'theme' | 'audio' | 'preview' | 'final' | 'library';
type CreationStep = 'upload' | 'story' | 'script' | 'theme' | 'audio' | 'preview' | 'final';

interface VideoData {
  uploadedImages: ImageUploadResponse[];
  imageAnalysis?: ImageAnalysisResponse; // Store image analysis results
  story: string;
  script: string;
  chapters: Chapter[];
  theme: string;
  audio: {
    music: string;
    voice: Voice | null;
    subtitles: boolean;
  };
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [completedSteps, setCompletedSteps] = useState<Set<CreationStep>>(new Set());
  const [isProcessingStory, setIsProcessingStory] = useState(false);
  const [isProcessingImageAnalysis, setIsProcessingImageAnalysis] = useState(false);
  const [videoData, setVideoData] = useState<VideoData>({
    uploadedImages: [],
    story: '',
    script: '',
    chapters: [],
    theme: '',
    audio: { music: '', voice: null, subtitles: true }
  });
  const { toast } = useToast();

  const handleCreateNew = () => {
    // Clear all data for fresh session
    setCurrentStep('upload');
    setCompletedSteps(new Set());
    setVideoData({ 
      uploadedImages: [], 
      story: '', 
      script: '', 
      chapters: [],
      theme: '', 
      audio: { music: '', voice: null, subtitles: true } 
    });
    setIsProcessingImageAnalysis(false);
    setIsProcessingStory(false);
  };
  const handleViewPast = () => setCurrentStep('library');
  
  const handleStepClick = (step: CreationStep) => {
    setCurrentStep(step);
  };

  const markStepCompleted = (step: CreationStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  // Helper function to check if a step can proceed (previous step completed)
  const canProceedFromStep = (step: CreationStep): boolean => {
    const stepOrder: CreationStep[] = ['upload', 'story', 'script', 'theme', 'audio', 'preview', 'final'];
    const currentIndex = stepOrder.indexOf(step);
    
    // First step (upload) can always proceed
    if (currentIndex === 0) return true;
    
    // Check if previous step is completed
    const previousStep = stepOrder[currentIndex - 1];
    return completedSteps.has(previousStep);
  };

  // Helper function to get dummy data for components when steps aren't completed
  const getDummyDataForStep = (step: CreationStep) => {
    const dummyImages: ImageUploadResponse[] = [
      { 
        id: 'dummy-1', 
        filename: 'family-photo.jpg',
        original_filename: 'family-photo.jpg', 
        file_size: 1024000,
        mime_type: 'image/jpeg', 
        processing_status: 'completed',
        upload_url: '', 
        metadata: {} 
      },
      { 
        id: 'dummy-2', 
        filename: 'vacation.jpg',
        original_filename: 'vacation.jpg', 
        file_size: 2048000,
        mime_type: 'image/jpeg', 
        processing_status: 'completed',
        upload_url: '', 
        metadata: {} 
      },
      { 
        id: 'dummy-3', 
        filename: 'graduation.jpg',
        original_filename: 'graduation.jpg', 
        file_size: 1536000,
        mime_type: 'image/jpeg', 
        processing_status: 'completed',
        upload_url: '', 
        metadata: {} 
      }
    ];

    const dummyChapters: Chapter[] = [
      { title: 'Chapter 1: Early Days', script: 'This is where your story begins. Share your earliest memories and formative experiences.' },
      { title: 'Chapter 2: Growing Years', script: 'The journey continues with your growth and development through different life stages.' },
      { title: 'Chapter 3: Life Milestones', script: 'Important achievements and milestones that shaped who you are today.' }
    ];

    return {
      uploadedImages: step === 'upload' || !canProceedFromStep(step) ? dummyImages : videoData.uploadedImages,
      story: step === 'story' || !canProceedFromStep(step) ? 'Tell us about your life journey, key moments, and cherished memories...' : videoData.story,
      chapters: step === 'script' || !canProceedFromStep(step) ? dummyChapters : videoData.chapters,
      script: step === 'script' || !canProceedFromStep(step) ? dummyChapters.map(c => c.script).join(' ') : videoData.script,
      theme: step === 'theme' || !canProceedFromStep(step) ? 'documentary' : videoData.theme,
      audio: step === 'audio' || !canProceedFromStep(step) ? { music: 'cinematic-default', voice: null, subtitles: true } : videoData.audio
    };
  };

  const handleBack = () => {
    const stepFlow: Step[] = ['welcome', 'upload', 'story', 'script', 'theme', 'audio', 'preview', 'final'];
    const currentIndex = stepFlow.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepFlow[currentIndex - 1]);
    }
  };

  const handleUploadNext = async (uploadedImages: ImageUploadResponse[]) => {
    // Update images in state immediately and proceed to next step
    setVideoData(prev => ({ ...prev, uploadedImages }));
    markStepCompleted('upload');
    setCurrentStep('story');
    
    // Start image analysis in background
    setIsProcessingImageAnalysis(true);
    
    try {
      // Prepare image analysis request
      const analysisRequest = {
        images: uploadedImages.map(img => ({
          img_id: img.id,
          metadata: img.metadata || {}
        })),
        request_timestamp: new Date().toISOString()
      };

      console.log('🔍 Starting background image analysis for uploaded images:', analysisRequest);

      // Call image analysis API in background
      const analysisResponse = await imageAnalysisApiService.analyzeBatch(analysisRequest);
      
      // Store analysis results when completed
      setVideoData(prev => ({ ...prev, imageAnalysis: analysisResponse }));
      
      // Log the detailed JSON response to console as requested
      console.log('📊 Background Image Analysis Results:', JSON.stringify(analysisResponse, null, 2));
      
      toast({
        title: "Image analysis completed!",
        description: "Your photos have been analyzed successfully.",
      });
      
    } catch (error) {
      console.error('❌ Background image analysis failed:', error);
      
      toast({
        title: "Image analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during image analysis.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImageAnalysis(false);
    }
  };

  const handleStoryNext = async (story: string) => {
    setIsProcessingStory(true);
    
    try {
      // Update story in state immediately
      setVideoData(prev => ({ ...prev, story }));
      
      // Call backend API to parse the story into structured chapters
      const response = await apiService.parseScript(story);
      
      // Update state with structured chapters
      setVideoData(prev => ({ 
        ...prev, 
        chapters: response.chapters,
        script: response.chapters.map(chapter => chapter.script).join(' ')
      }));
      
      markStepCompleted('story');
      setCurrentStep('script');
      
      toast({
        title: "Story processed successfully!",
        description: "Your story has been structured into chapters.",
      });
      
    } catch (error) {
      console.error('Error processing story:', error);
      
      toast({
        title: "Error processing story",
        description: error instanceof Error ? error.message : "Failed to process your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingStory(false);
    }
  };

  const handleScriptNext = (script: string) => {
    setVideoData(prev => ({ ...prev, script }));
    markStepCompleted('script');
    setCurrentStep('theme');
  };

  const handleThemeNext = (theme: string) => {
    setVideoData(prev => ({ ...prev, theme }));
    markStepCompleted('theme');
    setCurrentStep('audio');
  };

  const handleAudioNext = (audio: { music: string; voice: Voice | null; subtitles: boolean }) => {
    setVideoData(prev => ({ ...prev, audio }));
    markStepCompleted('audio');
    setCurrentStep('preview');
  };

  const handlePreviewApprove = () => {
    markStepCompleted('preview');
    setCurrentStep('final');
  };
  
  const handleStartOver = () => {
    setCurrentStep('welcome');
    setCompletedSteps(new Set());
    setVideoData({ 
      uploadedImages: [], 
      story: '', 
      script: '', 
      chapters: [],
      theme: '', 
      audio: { music: '', voice: null, subtitles: true } 
    });
    setIsProcessingImageAnalysis(false);
    setIsProcessingStory(false);
  };

  // Render current step
  const creationSteps: CreationStep[] = ['upload', 'story', 'script', 'theme', 'audio', 'preview', 'final'];
  const showProgress = creationSteps.includes(currentStep as CreationStep);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {showProgress && (
        <StepProgress
          currentStep={currentStep as CreationStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      )}
      
      <div className={showProgress ? "" : "min-h-screen"}>
        {(() => {
          switch (currentStep) {
            case 'welcome':
              return <Welcome onCreateNew={handleCreateNew} onViewPast={handleViewPast} />;
            case 'upload':
              const uploadData = getDummyDataForStep('upload');
              return <UploadPhotos onNext={handleUploadNext} onBack={handleBack} initialImages={uploadData.uploadedImages} canProceed={canProceedFromStep('upload')} />;
            case 'story':
              const storyData = getDummyDataForStep('story');
              return <TellStory onNext={handleStoryNext} onBack={handleBack} isLoading={isProcessingStory} initialStory={storyData.story} canProceed={canProceedFromStep('story')} />;
            case 'script':
              const scriptData = getDummyDataForStep('script');
              return <ApproveScript 
                chapters={scriptData.chapters} 
                imageAnalysis={videoData.imageAnalysis}
                isProcessingImageAnalysis={isProcessingImageAnalysis}
                onNext={handleScriptNext} 
                onBack={handleBack} 
                canProceed={canProceedFromStep('script')}
              />;
            case 'theme':
              return <ChooseTheme onNext={handleThemeNext} onBack={handleBack} canProceed={canProceedFromStep('theme')} />;
            case 'audio':
              return <ChooseAudio onNext={handleAudioNext} onBack={handleBack} canProceed={canProceedFromStep('audio')} />;
            case 'preview':
              const previewData = getDummyDataForStep('preview');
              return <PreviewVideo 
                onApprove={handlePreviewApprove} 
                onBack={handleBack} 
                chapters={previewData.chapters}
                uploadedImages={previewData.uploadedImages}
                imageAnalysis={videoData.imageAnalysis}
                theme={previewData.theme}
                audio={previewData.audio}
                canProceed={canProceedFromStep('preview')}
              />;
            case 'final':
              return <FinalDelivery onStartOver={handleStartOver} canProceed={canProceedFromStep('final')} />;
            case 'library':
              return <VideoLibrary onBack={() => setCurrentStep('welcome')} onCreateNew={handleCreateNew} />;
            default:
              return <Welcome onCreateNew={handleCreateNew} onViewPast={handleViewPast} />;
          }
        })()}
      </div>
    </div>
  );
};

export default Index;
