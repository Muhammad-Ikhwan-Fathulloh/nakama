import { useCallback, useMemo, useState } from "react";
import type { useAppContext } from "@/context/app-context";
import { formatError } from "@/lib/client";
import {
  buildConfigureProviderRequest,
  type SelectedProvider,
  validateApiKeyForProvider,
} from "@/lib/models";

interface UseReplaceApiKeyFormOptions {
  models: NonNullable<ReturnType<typeof useAppContext>["models"]>;
  configureProvider: ReturnType<typeof useAppContext>["configureProvider"];
  onFormError: (error: string | null) => void;
  onSuccess?: () => void;
}

export function useReplaceApiKeyForm({
  models,
  configureProvider,
  onFormError,
  onSuccess,
}: UseReplaceApiKeyFormOptions) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const provider = models.provider as SelectedProvider;

  const error = useMemo(() => {
    if (!touched || !apiKey.trim()) {
      return null;
    }
    return validateApiKeyForProvider(apiKey, provider);
  }, [apiKey, provider, touched]);

  const reset = useCallback(() => {
    setOpen(false);
    setApiKey("");
    setTouched(false);
    setShowApiKey(false);
    onFormError(null);
  }, [onFormError]);

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setApiKey(value);
      onFormError(null);
    },
    [onFormError],
  );

  const openForm = useCallback(
    (onOpen?: () => void) => {
      setOpen(true);
      onFormError(null);
      onOpen?.();
    },
    [onFormError],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedKey = apiKey.trim();
      const nextError = validateApiKeyForProvider(trimmedKey, provider);

      setTouched(true);

      if (nextError) {
        document.getElementById("replace-api-key")?.focus();
        return;
      }

      const modelToSave = models.currentModel ?? "";

      setBusy(true);
      onFormError(null);

      try {
        await configureProvider(
          buildConfigureProviderRequest({
            apiKey: trimmedKey,
            provider,
            model: modelToSave || undefined,
            displayName: models.displayName ?? undefined,
            baseUrl: models.baseUrl ?? undefined,
            customModels: models.customModels,
          }),
        );
        setApiKey("");
        setTouched(false);
        setShowApiKey(false);
        setOpen(false);
        onSuccess?.();
      } catch (err) {
        onFormError(formatError(err));
        document.getElementById("replace-api-key")?.focus();
      } finally {
        setBusy(false);
      }
    },
    [apiKey, configureProvider, models, onFormError, onSuccess, provider],
  );

  return {
    open,
    apiKey,
    showApiKey,
    error,
    busy,
    openForm,
    reset,
    handleBlur,
    handleChange,
    handleSubmit,
    toggleShowApiKey: () => setShowApiKey((current) => !current),
  };
}
