import { CheckIcon } from "lucide-react";
import { SETUP_STEPS, type SetupStepId } from "@/components/setup-wizard/SetupWizard";
import { cn } from "@/lib/utils";

interface SetupWizardStepperProps {
  currentStep: SetupStepId;
}

export function SetupWizardStepper({ currentStep }: SetupWizardStepperProps) {
  return (
    <nav aria-label="Setup progress" className="flex items-center gap-0">
      {SETUP_STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isUpcoming = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "h-px flex-1 mx-2",
                  isCompleted ? "bg-primary" : "bg-border",
                )}
              />
            )}

            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isCurrent && "bg-primary/10 text-primary font-medium",
                isCompleted && "text-primary",
                isUpcoming && "text-muted-foreground",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  isUpcoming && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="size-3.5" aria-hidden />
                ) : (
                  step.id
                )}
              </span>

              <span className="hidden sm:inline truncate max-w-[5rem]">
                {step.label}
              </span>

              {step.required && (
                <span className="hidden md:inline text-[10px] uppercase tracking-wider text-muted-foreground">
                  required
                </span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}