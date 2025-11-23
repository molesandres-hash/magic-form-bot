/**
 * useWizardState Hook
 *
 * Purpose: Manages the state and logic for the InputStepWizard component
 * Clean Code Principle: Separation of Concerns - Logic separated from UI
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
    WIZARD_CONFIG,
    VALIDATION_MESSAGES,
    SUCCESS_MESSAGES,
    API_KEY_MESSAGES,
    EXTRACTION_MESSAGES,
    WARNING_MESSAGES
} from '@/constants/wizardConstants';
import { WIZARD_EXAMPLES } from '@/constants/examples';
import { getStoredApiKey } from '@/components/settings/ApiKeySettings';
import { extractCourseDataWithGemini, extractCourseDataWithDoubleCheck } from '@/services/geminiService';

export const useWizardState = (onComplete: (data: any) => void) => {
    // State
    const [currentSubStep, setCurrentSubStep] = useState<number>(WIZARD_CONFIG.FIRST_STEP);
    const [courseData, setCourseData] = useState("");
    const [modulesData, setModulesData] = useState("");
    const [participantsData, setParticipantsData] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [useDoubleCheck, setUseDoubleCheck] = useState(true);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressPercent, setProgressPercent] = useState(0);

    // Validation
    const validateStepData = (step: number): boolean => {
        if (step === 1 && !courseData.trim()) {
            toast.error(VALIDATION_MESSAGES.COURSE_EMPTY);
            return false;
        }
        if (step === 2 && !modulesData.trim()) {
            toast.error(VALIDATION_MESSAGES.MODULES_EMPTY);
            return false;
        }
        if (step === 3 && !participantsData.trim()) {
            toast.error(VALIDATION_MESSAGES.PARTICIPANTS_EMPTY);
            return false;
        }
        return true;
    };

    // Navigation
    const handleNext = () => {
        if (!validateStepData(currentSubStep)) return;

        if (currentSubStep < WIZARD_CONFIG.LAST_STEP) {
            setCurrentSubStep(currentSubStep + 1);
            toast.success(SUCCESS_MESSAGES.STEP_COMPLETED(currentSubStep));
        }
    };

    const handleBack = () => {
        if (currentSubStep > WIZARD_CONFIG.FIRST_STEP) {
            setCurrentSubStep(currentSubStep - 1);
        }
    };

    // Actions
    const handlePasteExample = (step: number) => {
        if (step === 1) setCourseData(WIZARD_EXAMPLES[1]);
        if (step === 2) setModulesData(WIZARD_EXAMPLES[2]);
        if (step === 3) setParticipantsData(WIZARD_EXAMPLES[3]);
        toast.success(SUCCESS_MESSAGES.EXAMPLE_LOADED);
    };

    const handleExtraction = async () => {
        // 1. Validate all steps
        if (!courseData.trim() || !modulesData.trim() || !participantsData.trim()) {
            toast.error(VALIDATION_MESSAGES.ALL_STEPS_REQUIRED);
            return;
        }

        // 2. Check API Key
        const apiKey = getStoredApiKey();
        if (!apiKey) {
            toast.error(API_KEY_MESSAGES.MISSING, {
                description: API_KEY_MESSAGES.MISSING_DESCRIPTION,
                action: {
                    label: API_KEY_MESSAGES.CONFIGURE_BUTTON,
                    onClick: () => document.querySelector<HTMLElement>('[data-trigger="settings"]')?.click(),
                },
            });
            return;
        }

        setIsProcessing(true);
        setProgressPercent(0);

        try {
            let result;

            if (useDoubleCheck) {
                // Double Check Extraction
                setProgressMessage("Avvio doppia verifica...");
                result = await extractCourseDataWithDoubleCheck(
                    apiKey,
                    courseData,
                    modulesData,
                    participantsData,
                    (msg, percent) => {
                        setProgressMessage(msg);
                        setProgressPercent(percent);
                    }
                );

                // Show double check results
                if (result.metadata?.double_check) {
                    const { match_percentage, differences_count } = result.metadata.double_check;
                    const message = SUCCESS_MESSAGES.DOUBLE_CHECK_SUCCESS(match_percentage, differences_count);

                    if (match_percentage >= 95) {
                        toast.success(message.title, { description: message.description });
                    } else if (match_percentage >= 80) {
                        toast.warning(WARNING_MESSAGES.LOW_MATCH(match_percentage), {
                            description: message.description
                        });
                    } else {
                        toast.error(WARNING_MESSAGES.LOW_MATCH(match_percentage), {
                            description: WARNING_MESSAGES.VERIFY_MANUALLY
                        });
                    }
                }
            } else {
                // Standard Extraction
                setProgressMessage("Estrazione con AI in corso...");
                setProgressPercent(30);
                result = await extractCourseDataWithGemini(
                    apiKey,
                    courseData,
                    modulesData,
                    participantsData
                );
                setProgressPercent(100);
            }

            // Check for warnings
            if (result.metadata?.warnings?.length > 0) {
                toast.warning(WARNING_MESSAGES.WARNINGS_DETECTED(result.metadata.warnings.length));
            } else {
                toast.success(SUCCESS_MESSAGES.EXTRACTION_COMPLETE(result.metadata.completamento_percentuale));
            }

            onComplete(result);
        } catch (error: any) {
            console.error("Extraction error:", error);

            if (error.message.includes("429")) {
                toast.error(API_KEY_MESSAGES.QUOTA_EXCEEDED, {
                    description: API_KEY_MESSAGES.QUOTA_DESCRIPTION
                });
            } else if (error.message.includes("403") || error.message.includes("key")) {
                toast.error(API_KEY_MESSAGES.INVALID, {
                    description: API_KEY_MESSAGES.INVALID_DESCRIPTION
                });
            } else {
                toast.error(EXTRACTION_MESSAGES.GENERIC_ERROR, {
                    description: error.message || EXTRACTION_MESSAGES.RETRY_DESCRIPTION
                });
            }
        } finally {
            setIsProcessing(false);
            setProgressMessage("");
            setProgressPercent(0);
        }
    };

    return {
        // State
        currentSubStep,
        courseData,
        modulesData,
        participantsData,
        isProcessing,
        useDoubleCheck,
        progressMessage,
        progressPercent,

        // Setters (needed for inputs)
        setCourseData,
        setModulesData,
        setParticipantsData,
        setUseDoubleCheck,

        // Handlers
        handleNext,
        handleBack,
        handlePasteExample,
        handleExtraction,
    };
};
