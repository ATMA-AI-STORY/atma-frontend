import { Camera, FileText, FileCheck, Palette, Music, Play, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Step = 'upload' | 'story' | 'script' | 'theme' | 'audio' | 'preview' | 'final';

interface StepProgressProps {
  currentStep: Step;
  completedSteps: Set<Step>;
  onStepClick: (step: Step) => void;
}

const stepConfig = [
  { key: 'upload', name: 'Upload Photos', icon: Camera },
  { key: 'story', name: 'Tell Story', icon: FileText },
  { key: 'script', name: 'Approve Script', icon: FileCheck },
  { key: 'theme', name: 'Choose Theme', icon: Palette },
  { key: 'audio', name: 'Choose Audio', icon: Music },
  { key: 'preview', name: 'Preview Video', icon: Play },
  { key: 'final', name: 'Final Video', icon: Download },
] as const;

export default function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  const currentStepIndex = stepConfig.findIndex(step => step.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / stepConfig.length) * 100;

  return (
    <div className="bg-card border-b border-border  z-50 shadow-soft">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-memory bg-clip-text text-transparent">
              ATMA
            </h1>
            <p className="text-sm text-muted-foreground">
  Step {currentStepIndex + 1} of {stepConfig.length}
  <span className="hidden md:inline"> • {Math.round(progressPercentage)}% Complete</span>
</p>

          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {stepConfig[currentStepIndex]?.name}
            </p>
            <p className="whitespace-nowrap text-xs text-muted-foreground">
              Creating Your Memory Video
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between gap-2">
          {stepConfig.map((step, index) => {
            const isCompleted = completedSteps.has(step.key as Step);
            const isCurrent = step.key === currentStep;
            const currentStepIndex = stepConfig.findIndex(s => s.key === currentStep);
            const stepIndex = index;
            
            // Allow clicking only on:
            // 1. Completed steps (can go back)
            // 2. Current step
            // 3. Next step if current is completed (but this is handled in parent)
            const isClickable = isCompleted || isCurrent || (stepIndex < currentStepIndex);
            
            const Icon = step.icon;

            return (
              <button
                key={step.key}
                onClick={() => isClickable && onStepClick(step.key as Step)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-300 group min-w-0 flex-1",
                  isClickable ? "hover:bg-accent cursor-pointer" : "cursor-not-allowed opacity-60",
                  isCurrent && "bg-primary/10 ring-2 ring-primary/20"
                )}
              >
                {/* Icon Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary"
                      : isClickable
                      ? "bg-muted text-muted-foreground group-hover:bg-accent"
                      : "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  <Icon size={18} />
                </div>

                {/* Step Info */}
                <div className="text-center min-w-0">
                  <div
                    className={cn(
                      "hidden md:block text-xs font-medium transition-colors duration-300 truncate",
                      isCompleted
                        ? "text-primary"
                        : isCurrent
                        ? "text-foreground"
                        : isClickable
                        ? "text-muted-foreground group-hover:text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  >
                    {step.name}
                  </div>
                  <div className={cn(
                    "hidden md:block text-xs",
                    isClickable ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Connector Line
                {index < stepConfig.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-8 left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                    style={{
                      left: `calc(${((index + 1) / stepConfig.length) * 100}% - ${
                        (1 / stepConfig.length) * 50
                      }%)`,
                      width: `calc(${(1 / stepConfig.length) * 100}% - 2rem)`,
                    }}
                  />
                )} */}

              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}