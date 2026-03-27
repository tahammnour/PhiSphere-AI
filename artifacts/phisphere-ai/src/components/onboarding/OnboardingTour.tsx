import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  position: "bottom" | "right" | "left" | "top" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to PhiSphere AI",
    description: "Your intelligent lab notebook — powered by Azure OpenAI, Azure AI safety services, and Responsible AI principles. Let's take a quick tour of the key features.",
    position: "center",
  },
  {
    id: "new-session",
    title: "Create Lab Sessions",
    description: "Click 'New Lab Session' to start a new experiment. Each session has its own conversation, data, and AI analysis history.",
    targetId: "tour-new-session",
    position: "right",
  },
  {
    id: "file-upload",
    title: "Upload Experiment Data",
    description: "Drop a CSV file for data analysis or upload an image. Azure AI Vision automatically analyzes your images — extracting captions, OCR text, and detected objects.",
    targetId: "tour-file-upload",
    position: "bottom",
  },
  {
    id: "sample-data",
    title: "Load Sample Datasets",
    description: "Not sure where to start? Load one of our pre-built datasets including plant sensor data, titration protocols, and more.",
    targetId: "tour-sample-data",
    position: "bottom",
  },
  {
    id: "safety-badge",
    title: "Azure AI Safety Checks",
    description: "Every AI response is safety-screened by Azure AI Content Safety before you see it. Look for the shield badge on each message — green means passed, yellow is flagged, red is blocked.",
    targetId: "tour-safety-badge",
    position: "bottom",
  },
  {
    id: "responsible-ai",
    title: "Responsible AI Insights",
    description: "Click the brain icon to open the Responsible AI panel — showing model confidence, safety summary, reasoning trace, and data grounding for the last response.",
    targetId: "tour-responsible-ai",
    position: "left",
  },
];

const STORAGE_KEY = "phisphere-tour-completed";

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentStep?.targetId || currentStep.position === "center") {
      setTooltipPos({ top: 0, left: 0 });
      return;
    }
    const target = document.getElementById(currentStep.targetId);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const tw = tooltip?.offsetWidth ?? 320;
    const th = tooltip?.offsetHeight ?? 160;

    if (currentStep.position === "right") {
      setTooltipPos({ top: rect.top, left: rect.right + 12 });
    } else if (currentStep.position === "left") {
      setTooltipPos({ top: rect.top, left: rect.left - tw - 12 });
    } else if (currentStep.position === "bottom") {
      setTooltipPos({ top: rect.bottom + 12, left: Math.max(8, rect.left + rect.width / 2 - tw / 2) });
    } else if (currentStep.position === "top") {
      setTooltipPos({ top: rect.top - th - 12, left: rect.left + rect.width / 2 - tw / 2 });
    }
  }, [step, currentStep]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    setTimeout(onComplete, 200);
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  const isCenter = !currentStep?.targetId || currentStep.position === "center";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
        onClick={handleDismiss}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[60] w-80 rounded-2xl border border-primary/30 bg-slate-900 shadow-2xl shadow-black/50 transition-all duration-200 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={
          isCenter
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : { top: tooltipPos.top, left: tooltipPos.left }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary ring-1 ring-primary/30">
              {step + 1}
            </span>
            <h3 className="text-sm font-bold text-foreground">{currentStep?.title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="text-xs text-slate-300 leading-relaxed">{currentStep?.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-4 bg-primary" : "w-1.5 bg-slate-600 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 px-5 py-4">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-primary/90 transition-colors"
            >
              {step < TOUR_STEPS.length - 1 ? (
                <>Next <ArrowRight className="h-3 w-3" /></>
              ) : (
                "Start Experimenting"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useShouldShowTour() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  return { show, dismiss: () => setShow(false) };
}
