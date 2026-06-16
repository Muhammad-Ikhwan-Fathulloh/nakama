import { TelegramSettingsCard } from "@/components/TelegramSettingsCard";
import { Button } from "@/components/ui/button";

interface SetupStepTelegramProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function SetupStepTelegram({ onNext, onSkip, onBack }: SetupStepTelegramProps) {
  return (
    <div className="space-y-4">
      <TelegramSettingsCard
        embedded
        submitLabel="Continue"
        onSaveSuccess={onNext}
      />

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          Back
        </Button>

        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          onClick={onSkip}
        >
          Set up later
        </button>
      </div>
    </div>
  );
}