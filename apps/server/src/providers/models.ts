import {
  findCustomModel,
  validateCustomModels,
  type CustomModelEntry,
} from "@tinyclaw/core";
import type { ProviderName } from "@tinyclaw/core";
import type { ProviderModelOption as ContractProviderModelOption } from "@tinyclaw/core/contract";
import {
  resolveCompatibleDefaultModel,
  resolveOpenRouterDefaultModel,
} from "./compatible-models";

export type ProviderModelOption = ContractProviderModelOption & {
  contextWindow: number;
  maxOutputTokens: number;
};

export const AVAILABLE_MODELS: ProviderModelOption[] = [
  {
    id: "claude-sonnet-4-6",
    name: "Sonnet 4.6",
    provider: "anthropic",
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    default: true,
    inputPerMillionUsd: 3,
    outputPerMillionUsd: 15,
  },
  {
    id: "claude-opus-4-6",
    name: "Opus 4.6",
    provider: "anthropic",
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    inputPerMillionUsd: 15,
    outputPerMillionUsd: 75,
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "openai",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    inputPerMillionUsd: 2.5,
    outputPerMillionUsd: 10,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    default: true,
    inputPerMillionUsd: 2,
    outputPerMillionUsd: 8,
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    provider: "openai",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    inputPerMillionUsd: 1.5,
    outputPerMillionUsd: 6,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    default: true,
    inputPerMillionUsd: 0.15,
    outputPerMillionUsd: 0.6,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    inputPerMillionUsd: 1.25,
    outputPerMillionUsd: 5,
  },
];

const OPENROUTER_MODEL_SLUG_PATTERN = /^[\w.-]+\/[\w.:-]+$/;

export function isOpenRouterModelSlug(model: string): boolean {
  return OPENROUTER_MODEL_SLUG_PATTERN.test(model.trim());
}

export function validateOpenRouterCustomModels(entries: unknown): CustomModelEntry[] {
  const models = validateCustomModels(entries);

  for (const model of models) {
    if (!isOpenRouterModelSlug(model.id)) {
      throw new Error(
        `Invalid OpenRouter model id "${model.id}". Use vendor/model format.`,
      );
    }
  }

  return models;
}

export function getAvailableModels(): ProviderModelOption[] {
  return AVAILABLE_MODELS;
}

export function getModelById(modelId: string): ProviderModelOption | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId);
}

export function getModelsForProvider(
  provider: ProviderName,
): ProviderModelOption[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

export function getDefaultModel(
  provider: ProviderName,
  customModels?: CustomModelEntry[],
): string {
  if (provider === "openai_compatible") {
    return resolveCompatibleDefaultModel(customModels);
  }

  if (provider === "openrouter" && customModels?.length) {
    return resolveOpenRouterDefaultModel(customModels);
  }

  const models = getModelsForProvider(provider);
  const fallback =
    provider === "openrouter"
      ? "anthropic/claude-sonnet-4-6"
      : provider === "anthropic"
        ? "claude-sonnet-4-6"
        : provider === "gemini"
          ? "gemini-2.5-flash"
          : "gpt-5.4";
  return models.find((model) => model.default)?.id ?? models[0]?.id ?? fallback;
}

export function isValidModel(model: string): boolean {
  return AVAILABLE_MODELS.some((option) => option.id === model);
}

export function resolveModel(
  provider: ProviderName,
  model?: string,
  customModels?: CustomModelEntry[],
): string {
  const trimmed = model?.trim();

  if (trimmed && provider === "openrouter" && isOpenRouterModelSlug(trimmed)) {
    return trimmed;
  }

  if (trimmed && provider === "openai_compatible") {
    if (findCustomModel(customModels, trimmed)) {
      return trimmed;
    }

    return resolveCompatibleDefaultModel(customModels, trimmed);
  }

  if (trimmed && isValidModel(trimmed)) {
    const option = getModelById(trimmed);

    if (option?.provider === provider) {
      return trimmed;
    }
  }

  if (
    trimmed &&
    (provider === "openai" || provider === "anthropic" || provider === "gemini")
  ) {
    return trimmed;
  }

  return getDefaultModel(provider, customModels);
}
