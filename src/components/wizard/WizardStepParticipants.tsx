import { Users, Sparkles, ChevronLeft, Shield, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WizardStepInput } from "./WizardStepInput";
import {
    STEP_TITLES,
    STEP_DESCRIPTIONS,
    PLACEHOLDER_TEXT,
    BUTTON_LABELS,
    DOUBLE_CHECK_TEXT,
    INFO_MESSAGES
} from "@/constants/wizardConstants";

interface WizardStepParticipantsProps {
    value: string;
    onChange: (value: string) => void;
    onLoadExample: () => void;
    onBack: () => void;
    onExtract: () => void;
    isProcessing: boolean;
    useDoubleCheck: boolean;
    setUseDoubleCheck: (value: boolean) => void;
    progressMessage: string;
    progressPercent: number;
}

export const WizardStepParticipants = ({
    value,
    onChange,
    onLoadExample,
    onBack,
    onExtract,
    isProcessing,
    useDoubleCheck,
    setUseDoubleCheck,
    progressMessage,
    progressPercent,
}: WizardStepParticipantsProps) => {

    const renderFooter = () => (
        <div className="space-y-4 pt-2">
            {/* Double Check Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="double-check" className="text-base font-medium">
                            {DOUBLE_CHECK_TEXT.TITLE}
                        </Label>
                        <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {DOUBLE_CHECK_TEXT.DESCRIPTION}
                    </p>
                </div>
                <Switch
                    id="double-check"
                    checked={useDoubleCheck}
                    onCheckedChange={setUseDoubleCheck}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack} disabled={isProcessing}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        {BUTTON_LABELS.BACK}
                    </Button>
                    <Button variant="outline" onClick={onLoadExample} disabled={isProcessing}>
                        <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                        {BUTTON_LABELS.LOAD_EXAMPLE}
                    </Button>
                </div>

                <Button
                    onClick={onExtract}
                    disabled={isProcessing}
                    className={`min-w-[200px] ${useDoubleCheck ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {BUTTON_LABELS.EXTRACTING}
                        </>
                    ) : (
                        <>
                            {useDoubleCheck ? (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    {BUTTON_LABELS.EXTRACT_DOUBLE_CHECK}
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    {BUTTON_LABELS.EXTRACT_AI}
                                </>
                            )}
                        </>
                    )}
                </Button>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{progressMessage}</span>
                        <span className="font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {useDoubleCheck && (
                        <p className="text-xs text-muted-foreground text-center italic">
                            {INFO_MESSAGES.DOUBLE_CHECK_DESCRIPTION}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <WizardStepInput
            title={STEP_TITLES.PARTICIPANTS}
            description={STEP_DESCRIPTIONS.PARTICIPANTS}
            icon={<Users className="h-6 w-6 text-primary" />}
            value={value}
            onChange={onChange}
            placeholder={PLACEHOLDER_TEXT.PARTICIPANTS}
            onLoadExample={onLoadExample}
            customFooter={renderFooter()}
        />
    );
};
