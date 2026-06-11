import type { SendMessageInput, StreamEvent } from "@tinyclaw/core/contract";
import type { SendMessageArg, StreamHandler, StreamHandlers } from "./types";

export async function readStreamEvents(
  body: ReadableStream<Uint8Array>,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";

  const abortReader = () => {
    void reader.cancel();
  };

  signal?.addEventListener("abort", abortReader, { once: true });

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const boundary = buffer.indexOf("\n\n");

        if (boundary < 0) {
          break;
        }

        const eventBlock = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of eventBlock.split("\n")) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const payload = JSON.parse(line.slice(6)) as StreamEvent;

          if (payload.type === "chunk") {
            handlers.onChunk(payload.delta);
            reply += payload.delta;
          }

          if (payload.type === "thinking") {
            handlers.onThinking?.(payload.delta);
          }

          if (payload.type === "tool_start") {
            handlers.onToolStart?.({
              toolCallId: payload.toolCallId,
              tool: payload.tool,
              input: payload.input,
            });
          }

          if (payload.type === "tool_end") {
            handlers.onToolEnd?.({
              toolCallId: payload.toolCallId,
              tool: payload.tool,
              result: payload.result,
            });
          }

          if (payload.type === "todos_updated") {
            handlers.onTodosUpdated?.(payload.todos);
          }

          if (payload.type === "done") {
            return payload.reply;
          }

          if (payload.type === "error") {
            throw new Error(payload.error);
          }
        }
      }
    }

    if (signal?.aborted) {
      return reply;
    }

    if (!reply) {
      throw new Error("Stream ended without a response.");
    }

    return reply;
  } catch (error) {
    if (signal?.aborted) {
      return reply;
    }

    throw error;
  } finally {
    signal?.removeEventListener("abort", abortReader);
  }
}

export function normalizeStreamHandlers(
  handler: StreamHandler | StreamHandlers,
): StreamHandlers {
  if (typeof handler === "function") {
    return { onChunk: handler };
  }

  return handler;
}

export function resolveSendMessageBody(input: SendMessageArg): SendMessageInput {
  return typeof input === "string" ? { message: input } : input;
}
