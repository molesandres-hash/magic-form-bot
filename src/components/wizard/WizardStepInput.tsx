import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { BUTTON_LABELS } from "@/constants/wizardConstants";

interface WizardStepInputProps {
    title: string;
    description: string;
    icon: ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    onLoadExample: () => void;
    onNext?: () => void;
    onBack?: () => void;
    customFooter?: ReactNode;
    minHeight?: number;
}

export const WizardStepInput = ({
    title,
    description,
    icon,
    value,
    onChange,
    placeholder,
    onLoadExample,
    onNext,
    onBack,
    customFooter,
    minHeight = 300,
}: WizardStepInputProps) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>

            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm p-4 border-2 focus-visible:ring-primary"
                style={{ minHeight: `${minHeight}px` }}
            />

            {customFooter ? (
                customFooter
            ) : (
                <div className="flex justify-between pt-2">
                    <div className="flex gap-2">
                        {onBack && (
                            <Button variant="outline" onClick={onBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                {BUTTON_LABELS.BACK}
                            </Button>
                        )}
                        <Button variant="outline" onClick={onLoadExample}>
                            <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                            {BUTTON_LABELS.LOAD_EXAMPLE}
                        </Button>
                    </div>

                    {onNext && (
                        <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
                            {BUTTON_LABELS.NEXT}
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
