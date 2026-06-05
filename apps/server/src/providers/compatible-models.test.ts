import { describe, expect, test } from "bun:test";
import { getModelsForConfiguredProvider, mergeOpenRouterCatalog } from "./compatible-models";

describe("mergeOpenRouterCatalog", () => {
  test("merges custom display names over static entries", () => {
    const staticModels = [
      {
        id: "anthropic/claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        provider: "openrouter" as const,
        contextWindow: 200_000,
        maxOutputTokens: 8_192,
      },
      {
        id: "openai/gpt-5.4",
        name: "GPT-5.4",
        provider: "openrouter" as const,
        contextWindow: 128_000,
        maxOutputTokens: 8_192,
      },
    ];
    const merged = mergeOpenRouterCatalog(staticModels, [
      { id: "anthropic/claude-sonnet-4-6", name: "My Sonnet" },
      { id: "google/gemini-2.5-pro-preview", name: "Gemini Pro" },
    ]);

    expect(merged.find((model) => model.id === "anthropic/claude-sonnet-4-6")?.name).toBe(
      "My Sonnet",
    );
    expect(merged.some((model) => model.id === "openai/gpt-5.4")).toBe(true);
    expect(merged.some((model) => model.id === "google/gemini-2.5-pro-preview")).toBe(true);
  });
});

describe("getModelsForConfiguredProvider openrouter", () => {
  test("uses shortlist only when custom models are saved", () => {
    const models = getModelsForConfiguredProvider("openrouter", {
      provider: "openrouter",
      apiKey: "sk-test",
      customModels: [{ id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama Free" }],
    });

    expect(
      models.some((model) => model.id === "meta-llama/llama-3.3-70b-instruct:free"),
    ).toBe(true);
    expect(models.some((model) => model.id === "openai/gpt-5.4")).toBe(false);
  });

  test("includes only the active model when no shortlist is saved", () => {
    const models = getModelsForConfiguredProvider("openrouter", {
      provider: "openrouter",
      apiKey: "sk-test",
      model: "google/gemma-4-31b-it:free",
    });

    expect(models).toHaveLength(1);
    expect(models[0]?.id).toBe("google/gemma-4-31b-it:free");
    expect(models.some((model) => model.id === "openai/gpt-5.4")).toBe(false);
  });
});
