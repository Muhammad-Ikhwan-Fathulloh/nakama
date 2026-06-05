import type { ProviderModelOption } from "@tinyclaw/core/contract";
import { useCallback, useEffect, useState } from "react";
import type { useAppContext } from "@/context/app-context";
import { formatError } from "@/lib/client";
import { getModelDisplayName } from "@/lib/models";

interface UseConnectedModelDraftOptions {
  models: NonNullable<ReturnType<typeof useAppContext>["models"]>;
  catalog: ProviderModelOption[];
  setModel: ReturnType<typeof useAppContext>["setModel"];
  onFormError: (error: string | null) => void;
}

export function useConnectedModelDraft({
  models,
  catalog,
  setModel,
  onFormError,
}: UseConnectedModelDraftOptions) {
  const [draft, setDraft] = useState(models.currentModel ?? "");
  const [busy, setBusy] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  useEffect(() => {
    setDraft(models.currentModel ?? "");
  }, [models.currentModel]);

  const dirty = draft !== models.currentModel;

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      setSaveHint(null);
      onFormError(null);
    },
    [onFormError],
  );

  const handleSave = useCallback(async () => {
    if (!draft || draft === models.currentModel) {
      return;
    }

    setBusy(true);
    onFormError(null);
    setSaveHint(null);

    try {
      await setModel(draft);
      setSaveHint(`Saved · ${getModelDisplayName(catalog, draft)}`);
    } catch (err) {
      onFormError(formatError(err));
    } finally {
      setBusy(false);
    }
  }, [catalog, draft, models.currentModel, onFormError, setModel]);

  return {
    draft,
    busy,
    saveHint,
    dirty,
    handleDraftChange,
    handleSave,
  };
}
