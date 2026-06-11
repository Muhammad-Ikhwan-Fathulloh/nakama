export { TinyClawClient } from "./client";
export type {
  RemoteChatSession,
  SendMessageArg,
  SendStreamOptions,
  StreamHandler,
  StreamHandlers,
  TinyClawClientOptions,
} from "./types";
export { formatClientError as formatError, TinyClawApiError } from "@tinyclaw/core/api-error";

import type { ProfileSummary } from "@tinyclaw/core/contract";
import { TinyClawClient } from "./client";
import type { TinyClawClientOptions } from "./types";

export function createClient(options?: TinyClawClientOptions): TinyClawClient {
  return new TinyClawClient(options);
}

export function getProfileAvatarUrl(
  profile: Pick<ProfileSummary, "id" | "hasAvatar" | "updatedAt">,
): string | null {
  if (!profile.hasAvatar) {
    return null;
  }

  const query = new URLSearchParams({ v: profile.updatedAt });
  return `/v1/profiles/${encodeURIComponent(profile.id)}/avatar?${query.toString()}`;
}
