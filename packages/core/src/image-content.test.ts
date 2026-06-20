import { describe, expect, test } from "bun:test";
import type { ChatMessage } from "./contract";
import {
  extractImageParts,
  formatImageDescriptionText,
  isImageDescriptionText,
  parseImageDescriptionText,
  replaceImagePartsWithDescriptions,
  resolveMessagesForNonVisionProvider,
  resolveUserContentForNonVisionProvider,
} from "./image-content";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("extractImageParts", () => {
  test("returns empty array for plain text", () => {
    expect(extractImageParts("hello")).toEqual([]);
  });

  test("extracts image parts from content array", () => {
    const parts = extractImageParts([
      { type: "text", text: "What is this?" },
      { type: "image", mediaType: "image/png", data: tinyPngBase64 },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0]?.mediaType).toBe("image/png");
  });
});

describe("replaceImagePartsWithDescriptions", () => {
  test("annotates image parts with descriptions", () => {
    const result = replaceImagePartsWithDescriptions(
      [
        { type: "text", text: "What is this?" },
        { type: "image", mediaType: "image/png", data: tinyPngBase64 },
      ],
      ["A red square on white background."],
    );

    expect(result).toEqual([
      { type: "text", text: "What is this?" },
      {
        type: "image",
        mediaType: "image/png",
        data: tinyPngBase64,
        description: "A red square on white background.",
      },
    ]);
  });

  test("returns plain string when only image descriptions remain for string content", () => {
    const result = replaceImagePartsWithDescriptions(
      [{ type: "image", mediaType: "image/png", data: tinyPngBase64 }],
      ["A chart with three bars."],
    );

    expect(result).toEqual([
      {
        type: "image",
        mediaType: "image/png",
        data: tinyPngBase64,
        description: "A chart with three bars.",
      },
    ]);
  });
});

describe("image description text helpers", () => {
  test("formats and parses image description text", () => {
    const text = formatImageDescriptionText("A diagram with arrows.");
    expect(isImageDescriptionText(text)).toBe(true);
    expect(parseImageDescriptionText(text)).toBe("A diagram with arrows.");
  });
});

describe("resolveUserContentForNonVisionProvider", () => {
  test("converts described image parts to text", () => {
    const result = resolveUserContentForNonVisionProvider([
      { type: "text", text: "What is this?" },
      {
        type: "image",
        mediaType: "image/png",
        data: tinyPngBase64,
        description: "A red square.",
      },
    ]);

    expect(result).toEqual([
      { type: "text", text: "What is this?" },
      { type: "text", text: "[Image]\nA red square." },
    ]);
  });

  test("passes through image parts without descriptions", () => {
    const imagePart = { type: "image", mediaType: "image/png", data: tinyPngBase64 } as const;
    expect(resolveUserContentForNonVisionProvider([imagePart])).toEqual([imagePart]);
  });
});

describe("resolveMessagesForNonVisionProvider", () => {
  test("maps only user messages", () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "image",
            mediaType: "image/png",
            data: tinyPngBase64,
            description: "A chart.",
          },
        ],
      },
      { role: "assistant", content: "Looks like a chart." },
    ];

    expect(resolveMessagesForNonVisionProvider(messages)).toEqual([
      { role: "user", content: "[Image]\nA chart." },
      { role: "assistant", content: "Looks like a chart." },
    ]);
  });
});
