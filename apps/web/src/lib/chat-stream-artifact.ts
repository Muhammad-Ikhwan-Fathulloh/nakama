import type { ChatListItem } from "@/lib/chat-history";
import {
  parseStreamingArtifactToolInput,
  type StreamingArtifactToolInput,
} from "@/lib/streaming-artifact-input";

export interface StreamingArtifactView {
  toolCallId: string;
  tool: string;
  parsed: StreamingArtifactToolInput;
  message: ChatListItem;
}

export function findLatestStreamingArtifact(
  messages: ChatListItem[],
): StreamingArtifactView | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message?.role !== "tool" ||
      !message.artifactStreaming ||
      !message.toolInputAccumulatedJson?.trim()
    ) {
      continue;
    }

    const parsed = parseStreamingArtifactToolInput(
      message.tool,
      message.toolInputAccumulatedJson,
    );

    if (!parsed.eligible && parsed.content === null) {
      continue;
    }

    if (!message.toolCallId || !message.tool) {
      continue;
    }

    return {
      toolCallId: message.toolCallId,
      tool: message.tool,
      parsed,
      message,
    };
  }

  return null;
}

export function upsertStreamingToolMessage(
  messages: ChatListItem[],
  event: {
    toolCallId: string;
    tool: string;
    accumulatedArguments: string;
  },
): ChatListItem[] {
  const parsed = parseStreamingArtifactToolInput(event.tool, event.accumulatedArguments);
  const isArtifactTool = event.tool === "write_file" || event.tool === "write_docx";

  if (!isArtifactTool) {
    return messages;
  }

  if (!parsed.eligible && parsed.content === null) {
    return messages;
  }

  const contentField = event.tool === "write_docx" ? "markdown" : "content";
  const toolInput =
    parsed.relativePath != null
      ? {
          path: `artifacts/${parsed.relativePath}`,
          ...(parsed.content != null ? { [contentField]: parsed.content } : {}),
        }
      : undefined;

  const nextMessage: ChatListItem = {
    id: event.toolCallId,
    role: "tool",
    content: event.tool,
    toolCallId: event.toolCallId,
    tool: event.tool,
    toolStatus: "running",
    artifactStreaming: true,
    toolInputAccumulatedJson: event.accumulatedArguments,
    ...(toolInput ? { toolInput } : {}),
  };

  const existingIndex = messages.findIndex(
    (message) => message.toolCallId === event.toolCallId,
  );

  if (existingIndex >= 0) {
    const next = [...messages];
    next[existingIndex] = {
      ...next[existingIndex],
      ...nextMessage,
    };
    return next;
  }

  const next = messages.map((message) =>
    message.role === "assistant" && message.streaming
      ? { ...message, streaming: false }
      : message,
  );

  return [...next, nextMessage];
}
