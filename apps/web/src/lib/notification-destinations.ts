import type { TelegramNotificationDestinationConfig } from "@tinyclaw/core/contract";

export function buildNotificationWebhookUrl(
  origin: string,
  webhookPath: string,
): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${webhookPath}`;
}

export function formatTelegramDestinationLabel(
  telegram: TelegramNotificationDestinationConfig,
): string {
  if (telegram.topicId) {
    return `Chat ${telegram.chatId} / Topic ${telegram.topicId}`;
  }

  return `Chat ${telegram.chatId}`;
}
