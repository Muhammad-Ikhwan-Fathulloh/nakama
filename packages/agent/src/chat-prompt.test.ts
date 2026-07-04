import { expect, test } from "bun:test";
import { buildChatSystemPrompt } from "./chat-prompt";
import { buildAutomationSystemPrompt } from "./prompt";

test("buildChatSystemPrompt includes automation skill pointer when create_automation is available", () => {
  const prompt = buildChatSystemPrompt(
    [
      {
        name: "create_automation",
        description: "Create automations",
        parameters: { type: "object", properties: {} },
      },
    ],
    { enableToolLoop: true },
  );

  expect(prompt).toContain("create-automation skill");
  expect(prompt).not.toContain("5-field cron syntax");
  expect(prompt).not.toContain("runAt");
});

test("buildChatSystemPrompt omits automation guidance when create_automation is unavailable", () => {
  const prompt = buildChatSystemPrompt(
    [{ name: "write_file", description: "Write", parameters: { type: "object", properties: {} } }],
    { enableToolLoop: true },
  );

  expect(prompt).not.toContain("create-automation skill");
  expect(prompt).not.toContain("5-field cron syntax");
});

test("buildChatSystemPrompt inserts USER.md section after identity", () => {
  const prompt = buildChatSystemPrompt([], {
    basePrompt: "You are a helpful assistant.",
    userContext: "Name: Alex\nRole: engineer",
  });

  const identityIndex = prompt.indexOf("You are a helpful assistant.");
  const userIndex = prompt.indexOf("# Personalisation (USER.md)");
  const runtimeIndex = prompt.indexOf("Chat naturally");

  expect(identityIndex).toBeGreaterThanOrEqual(0);
  expect(userIndex).toBeGreaterThan(identityIndex);
  expect(runtimeIndex).toBeGreaterThan(userIndex);
  expect(prompt).toContain("Name: Alex\nRole: engineer");
});

test("buildChatSystemPrompt omits USER.md section when empty", () => {
  const prompt = buildChatSystemPrompt([], {
    basePrompt: "You are a helpful assistant.",
    userContext: "   ",
  });

  expect(prompt).not.toContain("# Personalisation (USER.md)");
});
