import { expect, test } from "bun:test";
import { parseAutomationResponse } from "./parse";

test("parseAutomationResponse preserves email delivery", () => {
  const automation = parseAutomationResponse(
    JSON.stringify({
      name: "Daily digest",
      description: "Send a daily summary",
      trigger: { type: "schedule", cron: "0 8 * * *", timezone: "UTC" },
      delivery: {
        channel: "email",
        to: "user@example.com",
        notifyOn: "both",
      },
      steps: [],
    }),
    {
      prompt: "Summarize the latest updates and send the results to user@example.com",
      tools: [],
    },
  );

  expect(automation.delivery).toEqual({
    channel: "email",
    to: "user@example.com",
    notifyOn: "both",
  });
});
