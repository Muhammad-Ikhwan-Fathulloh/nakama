import { describe, expect, test } from "bun:test";
import {
  normalizeCreateNotificationDestinationRequest,
  normalizeNotificationWebhookRequest,
  normalizeUpdateNotificationDestinationRequest,
} from "./notification-destinations";

describe("normalizeNotificationWebhookRequest", () => {
  test("accepts the small webhook payload shape", () => {
    expect(
      normalizeNotificationWebhookRequest({
        title: "New payment received",
        body: "Customer: Ahmad",
        level: "success",
      }),
    ).toEqual({
      title: "New payment received",
      body: "Customer: Ahmad",
      level: "success",
    });
  });

  test("rejects empty body", () => {
    expect(() => normalizeNotificationWebhookRequest({ body: "   " })).toThrow(
      "body must be a non-empty string.",
    );
  });
});

describe("normalizeCreateNotificationDestinationRequest", () => {
  test("accepts a telegram destination request", () => {
    expect(
      normalizeCreateNotificationDestinationRequest({
        name: "Payments",
        channel: "telegram",
        telegram: { chatId: 123, topicId: 456 },
      }),
    ).toEqual({
      name: "Payments",
      channel: "telegram",
      telegram: { chatId: 123, topicId: 456 },
    });
  });

  test("rejects invalid telegram config", () => {
    expect(
      () =>
        normalizeCreateNotificationDestinationRequest({
          name: "Payments",
          channel: "telegram",
          telegram: { chatId: 0 },
        }),
    ).toThrow("telegram.chatId must be a positive integer.");
  });
});

describe("normalizeUpdateNotificationDestinationRequest", () => {
  test("normalizes nullable topic id", () => {
    expect(
      normalizeUpdateNotificationDestinationRequest({
        name: "Ops",
        telegram: { chatId: 123 },
      }),
    ).toEqual({
      name: "Ops",
      telegram: { chatId: 123, topicId: null },
    });
  });
});
