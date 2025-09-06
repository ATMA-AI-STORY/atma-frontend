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
    voice: string;
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
    audio: { music: '', voice: '', subtitles: true }
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
      audio: { music: '', voice: '', subtitles: true } 
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

  const handleAudioNext = (audio: { music: string; voice: string; subtitles: boolean }) => {
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
      audio: { music: '', voice: '', subtitles: true } 
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
              return <UploadPhotos onNext={handleUploadNext} onBack={handleBack} initialImages={videoData.uploadedImages} />;
            case 'story':
              return <TellStory onNext={handleStoryNext} onBack={handleBack} isLoading={isProcessingStory} initialStory={videoData.story} />;
            case 'script':
              return <ApproveScript 
                chapters={videoData.chapters} 
                imageAnalysis={videoData.imageAnalysis}
                isProcessingImageAnalysis={isProcessingImageAnalysis}
                onNext={handleScriptNext} 
                onBack={handleBack} 
              />;
            case 'theme':
              return <ChooseTheme onNext={handleThemeNext} onBack={handleBack} />;
            case 'audio':
              return <ChooseAudio onNext={handleAudioNext} onBack={handleBack} />;
            case 'preview':
              return <PreviewVideo 
                onApprove={handlePreviewApprove} 
                onBack={handleBack} 
                chapters={videoData.chapters}
                uploadedImages={videoData.uploadedImages}
                imageAnalysis={videoData.imageAnalysis}
                theme={videoData.theme}
                audio={videoData.audio}
              />;
            case 'final':
              return <FinalDelivery onStartOver={handleStartOver} />;
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
