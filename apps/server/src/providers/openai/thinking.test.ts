import { describe, expect, test, mock, afterEach } from "bun:test";
import { openAIModelRequiresResponsesApi, openAIModelSupportsThinking } from "./thinking";
import { createOpenAIProvider } from "./index";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("openAIModelSupportsThinking", () => {
  test("denies gpt-4o-mini from the catalog", () => {
    expect(openAIModelSupportsThinking("gpt-4o-mini")).toBe(false);
  });

  test("allows gpt-5 models", () => {
    expect(openAIModelSupportsThinking("gpt-5.4")).toBe(true);
    expect(openAIModelSupportsThinking("gpt-5.3-codex")).toBe(true);
  });

  test("denies gpt-4o variants by prefix", () => {
    expect(openAIModelSupportsThinking("gpt-4o-2025-08")).toBe(false);
  });

  test("respects custom model overrides", () => {
    expect(
      openAIModelSupportsThinking("gpt-4o-mini", [
        { id: "gpt-4o-mini", supportsThinking: true },
      ]),
    ).toBe(true);
  });
});

describe("openAIModelRequiresResponsesApi", () => {
  test("requires responses api for codex models", () => {
    expect(openAIModelRequiresResponsesApi("gpt-5.3-codex")).toBe(true);
    expect(openAIModelRequiresResponsesApi("GPT-5.3-Codex")).toBe(true);
    expect(openAIModelRequiresResponsesApi("gpt-5.4")).toBe(false);
  });
});

describe("OpenAI codex vision routing", () => {
  test("routes codex image requests through the responses api", async () => {
    const fetchMock = mock(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://api.openai.com/v1/responses");

      return new Response(
        JSON.stringify({
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "A screenshot of settings." }],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      model: "gpt-5.3-codex",
    });

    const result = await provider.generateChat({
      system: "Describe the image.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              mediaType: "image/png",
              data: "abc",
            },
          ],
        },
      ],
    });

    expect(result.content).toBe("A screenshot of settings.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
