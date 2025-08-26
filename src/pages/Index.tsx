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

type Step = 'welcome' | 'upload' | 'story' | 'script' | 'theme' | 'audio' | 'preview' | 'final' | 'library';
type CreationStep = 'upload' | 'story' | 'script' | 'theme' | 'audio' | 'preview' | 'final';

interface VideoData {
  images: File[];
  story: string;
  script: string;
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
  const [videoData, setVideoData] = useState<VideoData>({
    images: [],
    story: '',
    script: '',
    theme: '',
    audio: { music: '', voice: '', subtitles: true }
  });

  const handleCreateNew = () => setCurrentStep('upload');
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

  const handleUploadNext = (images: File[]) => {
    setVideoData(prev => ({ ...prev, images }));
    markStepCompleted('upload');
    setCurrentStep('story');
  };

  const handleStoryNext = (story: string) => {
    setVideoData(prev => ({ ...prev, story }));
    markStepCompleted('story');
    setCurrentStep('script');
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
    setVideoData({ images: [], story: '', script: '', theme: '', audio: { music: '', voice: '', subtitles: true } });
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
              return <UploadPhotos onNext={handleUploadNext} onBack={handleBack} />;
            case 'story':
              return <TellStory onNext={handleStoryNext} onBack={handleBack} />;
            case 'script':
              return <ApproveScript story={videoData.story} onNext={handleScriptNext} onBack={handleBack} />;
            case 'theme':
              return <ChooseTheme onNext={handleThemeNext} onBack={handleBack} />;
            case 'audio':
              return <ChooseAudio onNext={handleAudioNext} onBack={handleBack} />;
            case 'preview':
              return <PreviewVideo onApprove={handlePreviewApprove} onBack={handleBack} />;
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
