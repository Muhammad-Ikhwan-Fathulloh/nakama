import { WhatsAppSettingsCard } from "@/components/WhatsAppSettingsCard";
import { Button } from "@/components/ui/button";

interface SetupStepWhatsAppProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function SetupStepWhatsApp({ onNext, onSkip, onBack }: SetupStepWhatsAppProps) {
  return (
    <div className="space-y-4">
      <WhatsAppSettingsCard
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