/**
 * Input Step Wizard Component
 *
 * Purpose: Multi-step wizard for collecting course data from management system
 * Guides users through 3 steps: Course Data → Modules → Participants
 *
 * Clean Code Principles Applied:
 * - Separation of Concerns: Logic moved to useWizardState hook
 * - Component Composition: UI split into smaller, reusable components
 * - Centralized Configuration: Constants moved to wizardConstants.ts
 */

import { Card } from "@/components/ui/card";
import { FileText, Folder } from "lucide-react";
import WizardProgress from "./WizardProgress";
import { useWizardState } from "@/hooks/useWizardState";
import { WizardStepInput } from "@/components/wizard/WizardStepInput";
import { WizardStepParticipants } from "@/components/wizard/WizardStepParticipants";
import {
  STEP_LABELS,
  STEP_TITLES,
  STEP_DESCRIPTIONS,
  PLACEHOLDER_TEXT,
  FEATURE_HIGHLIGHTS
} from "@/constants/wizardConstants";

interface InputStepWizardProps {
  onComplete: (data: any) => void;
}

const InputStepWizard = ({ onComplete }: InputStepWizardProps) => {
  // Use custom hook for state and logic
  const {
    currentSubStep,
    courseData,
    modulesData,
    participantsData,
    isProcessing,
    useDoubleCheck,
    progressMessage,
    progressPercent,
    setCourseData,
    setModulesData,
    setParticipantsData,
    setUseDoubleCheck,
    handleNext,
    handleBack,
    handlePasteExample,
    handleExtraction,
  } = useWizardState(onComplete);

  const stepLabels = [
    STEP_LABELS.COURSE,
    STEP_LABELS.MODULES,
    STEP_LABELS.PARTICIPANTS,
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <WizardProgress
        currentStep={currentSubStep}
        totalSteps={stepLabels.length}
        stepLabels={stepLabels}
      />

      <Card className="p-6 shadow-lg border-t-4 border-t-primary">
        {/* Step 1: Course Data */}
        {currentSubStep === 1 && (
          <WizardStepInput
            title={STEP_TITLES.COURSE}
            description={STEP_DESCRIPTIONS.COURSE}
            icon={<FileText className="h-6 w-6 text-primary" />}
            value={courseData}
            onChange={setCourseData}
            placeholder={PLACEHOLDER_TEXT.COURSE}
            onLoadExample={() => handlePasteExample(1)}
            onNext={handleNext}
          />
        )}

        {/* Step 2: Modules Data */}
        {currentSubStep === 2 && (
          <WizardStepInput
            title={STEP_TITLES.MODULES}
            description={STEP_DESCRIPTIONS.MODULES}
            icon={<Folder className="h-6 w-6 text-primary" />}
            value={modulesData}
            onChange={setModulesData}
            placeholder={PLACEHOLDER_TEXT.MODULES}
            onLoadExample={() => handlePasteExample(2)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {/* Step 3: Participants Data & Extraction */}
        {currentSubStep === 3 && (
          <WizardStepParticipants
            value={participantsData}
            onChange={setParticipantsData}
            onLoadExample={() => handlePasteExample(3)}
            onBack={handleBack}
            onExtract={handleExtraction}
            isProcessing={isProcessing}
            useDoubleCheck={useDoubleCheck}
            setUseDoubleCheck={setUseDoubleCheck}
            progressMessage={progressMessage}
            progressPercent={progressPercent}
          />
        )}
      </Card>

      {/* Feature Highlights (Bottom Info Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {Object.values(FEATURE_HIGHLIGHTS).map((feature, index) => (
          <Card key={index} className="p-4 bg-muted/50 border-none">
            <h4 className="font-semibold text-primary mb-1">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InputStepWizard;
