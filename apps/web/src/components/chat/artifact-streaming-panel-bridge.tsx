import { useEffect, useMemo, useRef } from "react";
import { ArtifactAttachmentPanelBody } from "@/components/chat/artifact-attachment-panel-body";
import { useChatAttachmentPanel } from "@/context/use-chat-attachment-panel";
import { findLatestStreamingArtifact } from "@/lib/chat-stream-artifact";
import {
  artifactCodeLanguage,
  inferArtifactMimeType,
  isDocxFile,
  isHtmlArtifactMimeType,
  isLegacyDocFile,
  isMarkdownArtifactMimeType,
  toArtifactsRelativePath,
  type ChatArtifactRef,
} from "@/lib/chat-artifacts";
import type { ChatListItem } from "@/lib/chat-history";
import { client, formatError } from "@/lib/client";

function buildStreamingArtifactRef(
  filename: string,
  relativePath: string,
  tool: string,
): ChatArtifactRef {
  return {
    filename,
    path: relativePath,
    mimeType:
      tool === "write_docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : inferArtifactMimeType(filename),
    sizeBytes: 0,
    savedAt: "",
  };
}

export function ArtifactStreamingPanelBridge({
  messages,
  profileId,
}: {
  messages: ChatListItem[];
  profileId?: string | null;
}) {
  const { show, update, activeId } = useChatAttachmentPanel();
  const dismissedRef = useRef(new Set<string>());
  const openedRef = useRef<string | null>(null);
  const streaming = useMemo(() => findLatestStreamingArtifact(messages), [messages]);

  useEffect(() => {
    if (!profileId || !streaming) {
      return;
    }

    const panelId = streaming.toolCallId;

    if (dismissedRef.current.has(panelId)) {
      return;
    }

    const filename = streaming.parsed.filename ?? "Writing artifact…";
    const relativePath = streaming.parsed.relativePath ?? filename;
    const artifact = buildStreamingArtifactRef(filename, relativePath, streaming.tool);
    const mimeType = artifact.mimeType;
    const isWordDocument =
      isDocxFile(artifact.filename, mimeType) || isLegacyDocFile(artifact.filename, mimeType);
    const isHtml = isHtmlArtifactMimeType(mimeType);
    const isMarkdown = isMarkdownArtifactMimeType(mimeType) || isWordDocument;
    const language = artifactCodeLanguage(artifact.filename);
    const content = streaming.parsed.content ?? "";

    const body = (
      <ArtifactAttachmentPanelBody
        isHtml={false}
        isMarkdown={isMarkdown && !isHtml}
        language={language}
        mimeType={mimeType}
        loading={false}
        error={null}
        content={content || null}
        canPreview
        artifact={artifact}
        streaming
      />
    );

    if (activeId === panelId) {
      update(panelId, {
        title: filename,
        content: body,
      });
      return;
    }

    if (openedRef.current === panelId) {
      return;
    }

    openedRef.current = panelId;
    show({
      id: panelId,
      title: filename,
      defaultWidth: isMarkdown || language ? 768 : 448,
      resizable: true,
      fullscreen: false,
      content: body,
      onClose: () => {
        dismissedRef.current.add(panelId);
        openedRef.current = null;
      },
    });
  }, [activeId, profileId, show, streaming, update]);

  useEffect(() => {
    if (!profileId || !streaming) {
      return;
    }

    const completed = messages.find(
      (message) =>
        message.toolCallId === streaming.toolCallId &&
        message.role === "tool" &&
        message.toolStatus === "done" &&
        message.toolResult != null,
    );

    if (!completed || dismissedRef.current.has(streaming.toolCallId)) {
      return;
    }

    const result =
      typeof completed.toolResult === "object" && completed.toolResult !== null
        ? (completed.toolResult as { path?: string; error?: string })
        : null;

    if (!result || typeof result.error === "string" || typeof result.path !== "string") {
      return;
    }

    const relativePath = toArtifactsRelativePath(result.path);

    if (!relativePath) {
      return;
    }

    let cancelled = false;

    void client
      .readProfileArtifactContent(profileId, relativePath, {
        inline: true,
        render: streaming.tool === "write_docx" ? "markdown" : undefined,
      })
      .then((response) => {
        if (cancelled || activeId !== streaming.toolCallId) {
          return;
        }

        const text = new TextDecoder().decode(response.data);
        const artifact = buildStreamingArtifactRef(
          relativePath.split("/").pop() ?? relativePath,
          relativePath,
          streaming.tool,
        );
        const mimeType = artifact.mimeType;
        const isWordDocument =
          isDocxFile(artifact.filename, mimeType) ||
          isLegacyDocFile(artifact.filename, mimeType);
        const isMarkdown = isMarkdownArtifactMimeType(mimeType) || isWordDocument;

        update(streaming.toolCallId, {
          content: (
            <ArtifactAttachmentPanelBody
              isHtml={isHtmlArtifactMimeType(mimeType)}
              isMarkdown={isMarkdown}
              language={artifactCodeLanguage(artifact.filename)}
              mimeType={mimeType}
              loading={false}
              error={null}
              content={text}
              canPreview
              artifact={artifact}
            />
          ),
        });
      })
      .catch((error) => {
        if (cancelled || activeId !== streaming.toolCallId) {
          return;
        }

        update(streaming.toolCallId, {
          content: (
            <p className="p-4 text-sm text-destructive">{formatError(error)}</p>
          ),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, messages, profileId, streaming, update]);

  return null;
}
