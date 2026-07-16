import type {
  CachedMcpToolSummary,
  CreateMcpServerRequest,
  McpHttpConfig,
  McpServerSummary,
  McpStdioConfig,
  McpTransport,
} from "@nakama/core/contract";
import { useEffect, useState, type ClipboardEvent, type FormEvent } from "react";
import {
  argsToArray,
  emptyHeaderRow,
  headersToRecord,
  recordToHeaderRows,
  resolveFormTransport,
  type McpHeaderRow,
} from "@/components/soul-tools/mcp-tab/shared";
import { McpImportConfigDialog } from "@/components/soul-tools/mcp-tab/mcp-import-config-dialog";
import { McpServerDialogForm } from "@/components/soul-tools/mcp-tab/mcp-server-dialog-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMcpServerDetailQuery } from "@/hooks/use-app-queries";
import { client, formatError } from "@/lib/client";
import {
  parseMcpConfigJson,
  type ParsedMcpServerImport,
} from "@/lib/mcp-config-import";

export function McpServerDialog({
  open,
  busy,
  server,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  server?: McpServerSummary | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateMcpServerRequest) => Promise<void>;
}) {
  const isEdit = server != null;
  const { data: detail, isLoading: loadingDetail } = useMcpServerDetailQuery(
    open && server ? server.id : null,
  );
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<McpTransport>("http");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<McpHeaderRow[]>([emptyHeaderRow()]);
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [env, setEnv] = useState<McpHeaderRow[]>([emptyHeaderRow()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    toolCount: number;
    message: string;
    tools: CachedMcpToolSummary[];
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importDraft, setImportDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const idPrefix = server ? `mcp-edit-${server.id}` : "mcp-create";
  const loadingForm = isEdit && loadingDetail && !detail;
  const formDisabled = busy || testing || loadingForm;
  const activeTransport = resolveFormTransport(transport, command, url);
  const canSubmit =
    name.trim().length > 0 &&
    !loadingForm &&
    (activeTransport === "http" ? url.trim().length > 0 : command.trim().length > 0);

  useEffect(() => {
    if (!open) {
      setImportOpen(false);
      setImportDraft("");
      setImportError(null);
      return;
    }

    if (!server) {
      setName("");
      setTransport("http");
      setUrl("");
      setHeaders([emptyHeaderRow()]);
      setCommand("");
      setArgs([]);
      setEnv([emptyHeaderRow()]);
      setSubmitError(null);
      setTestResult(null);
      setTesting(false);
      return;
    }

    if (!detail) {
      return;
    }

    setName(detail.name);
    setTransport(detail.transport);
    setSubmitError(null);
    setTestResult(null);
    setTesting(false);

    if (detail.transport === "stdio") {
      const stdioConfig = detail.config as McpStdioConfig;
      setCommand(stdioConfig.command);
      setArgs(stdioConfig.args ?? []);
      setEnv(recordToHeaderRows(stdioConfig.env));
      setUrl("");
      setHeaders([emptyHeaderRow()]);
      return;
    }

    const httpConfig = detail.config as McpHttpConfig;
    setUrl(httpConfig.url);
    setHeaders(recordToHeaderRows(httpConfig.headers));
    setCommand("");
    setArgs([]);
    setEnv([emptyHeaderRow()]);
  }, [open, server, detail]);

  function buildRequest(): CreateMcpServerRequest {
    const activeTransport = resolveFormTransport(transport, command, url);

    if (activeTransport === "stdio") {
      return {
        name: name.trim(),
        transport: "stdio",
        config: {
          command: command.trim(),
          args: argsToArray(args),
          env: headersToRecord(env, isEdit),
        },
        connect: false,
        ...(isEdit && server ? { serverId: server.id } : {}),
      };
    }

    return {
      name: name.trim(),
      transport: "http",
      config: {
        url: url.trim(),
        headers: headersToRecord(headers, isEdit),
      },
      connect: false,
      ...(isEdit && server ? { serverId: server.id } : {}),
    };
  }

  async function handleTestConnection() {
    if (!canSubmit) {
      return;
    }

    setTesting(true);
    setSubmitError(null);
    setTestResult(null);

    try {
      const result = await client.testMcpServer(buildRequest());

      if (result.ok) {
        setTestResult({
          ok: true,
          toolCount: result.toolCount,
          tools: result.tools,
          message:
            result.toolCount === 0
              ? "Connected, but no tools were returned."
              : `Connected. Found ${result.toolCount} tool${result.toolCount === 1 ? "" : "s"}.`,
        });
        return;
      }

      setTestResult({
        ok: false,
        toolCount: 0,
        tools: [],
        message: result.error ?? "Connection test failed.",
      });
    } catch (error) {
      setTestResult({
        ok: false,
        toolCount: 0,
        tools: [],
        message: formatError(error),
      });
    } finally {
      setTesting(false);
    }
  }

  function applyImportedServer(imported: ParsedMcpServerImport) {
    setName(imported.name);
    setTransport(imported.transport);

    if (imported.transport === "stdio") {
      const stdioConfig = imported.config as McpStdioConfig;
      setCommand(stdioConfig.command);
      setArgs(stdioConfig.args ?? []);
      setEnv(recordToHeaderRows(stdioConfig.env));
      setUrl("");
      setHeaders([emptyHeaderRow()]);
    } else {
      const httpConfig = imported.config as McpHttpConfig;
      setUrl(httpConfig.url);
      setHeaders(recordToHeaderRows(httpConfig.headers));
      setCommand("");
      setArgs([]);
      setEnv([emptyHeaderRow()]);
    }
  }

  function tryImportJson(text: string): string | null {
    const result = parseMcpConfigJson(text);

    if (result === null) {
      return "Not a valid MCP server JSON config.";
    }

    if (!result.ok) {
      return result.error;
    }

    if (isEdit && result.server.transport !== transport) {
      return `Imported config uses ${result.server.transport}, but this server uses ${transport}.`;
    }

    applyImportedServer(result.server);
    setSubmitError(null);
    setTestResult(null);
    return null;
  }

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    if (formDisabled) {
      return;
    }

    const text = event.clipboardData.getData("text/plain");
    const result = parseMcpConfigJson(text);

    if (result === null) {
      return;
    }

    event.preventDefault();
    tryImportJson(text);
  }

  function openImportDialog() {
    setImportDraft("");
    setImportError(null);
    setImportOpen(true);
  }

  function handleImportApply() {
    const error = tryImportJson(importDraft);

    if (error) {
      setImportError(error);
      setTestResult(null);
      return;
    }

    setImportOpen(false);
    setImportDraft("");
    setImportError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit || busy) {
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit(buildRequest());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : formatError(error));
    }
  }

  function clearTestResult() {
    setTestResult(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-6 p-6 sm:max-w-lg">
          <form className="space-y-6" onSubmit={handleSubmit} onPaste={handlePaste}>
            <DialogHeader className="gap-2">
              <DialogTitle>{isEdit ? "Edit MCP server" : "Add MCP server"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? transport === "stdio"
                    ? "Update the command, args, or environment. Leave values blank to keep the current ones."
                    : "Update the server URL or headers. Leave values blank to keep the current ones."
                  : "Register an HTTP or command-based server, then assign it to profiles on the Profiles page."}
              </DialogDescription>
            </DialogHeader>

            <McpServerDialogForm
              idPrefix={idPrefix}
              isEdit={isEdit}
              transport={transport}
              name={name}
              url={url}
              headers={headers}
              command={command}
              args={args}
              env={env}
              formDisabled={formDisabled}
              loadingForm={loadingForm}
              canSubmit={canSubmit}
              testing={testing}
              testResult={testResult}
              submitError={submitError}
              onTransportChange={(nextTransport) => {
                setTransport(nextTransport);
                clearTestResult();
              }}
              onOpenImport={openImportDialog}
              onNameChange={(value) => {
                setName(value);
                clearTestResult();
              }}
              onUrlChange={(value) => {
                setUrl(value);
                if (value.trim()) {
                  setTransport("http");
                }
                clearTestResult();
              }}
              onHeadersChange={(nextHeaders) => {
                setHeaders(nextHeaders);
                clearTestResult();
              }}
              onCommandChange={(value) => {
                setCommand(value);
                if (value.trim()) {
                  setTransport("stdio");
                }
                clearTestResult();
              }}
              onArgsChange={(nextArgs) => {
                setArgs(nextArgs);
                clearTestResult();
              }}
              onEnvChange={(nextEnv) => {
                setEnv(nextEnv);
                clearTestResult();
              }}
              onTestConnection={() => void handleTestConnection()}
            />

            <DialogFooter className="gap-3 border-t-0 bg-transparent p-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={formDisabled}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formDisabled || !canSubmit}>
                {busy ? (
                  <Spinner className="size-4" />
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Add server"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <McpImportConfigDialog
        open={importOpen}
        importDraft={importDraft}
        importError={importError}
        formDisabled={formDisabled}
        onOpenChange={setImportOpen}
        onImportDraftChange={(value) => {
          setImportDraft(value);
          if (importError) {
            setImportError(null);
          }
        }}
        onApply={handleImportApply}
      />
    </>
  );
}
