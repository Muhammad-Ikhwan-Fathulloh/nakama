import {
  type AuthenticationCreds,
  type ConnectionState,
  type WASocket,
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import {
  getWhatsAppConfigDir,
} from "@tinyclaw/core/whatsapp-config";

export interface WhatsAppSocketDeps {
  onMessage: (data: { jid: string; text: string }) => Promise<void>;
  onConnected?: () => void;
}

export interface WhatsAppSocketHandle {
  socket: WASocket | null;
  start: () => Promise<void>;
  stop: () => void;
}

export async function createWhatsAppSocket(
  deps: WhatsAppSocketDeps,
): Promise<WhatsAppSocketHandle> {
  const authDir = getWhatsAppConfigDir() + "/auth";
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  let socket: WASocket | null = null;
  let stopped = false;

  const handle = {
    get socket() {
      return socket;
    },
    async start() {
      if (stopped) return;

      socket = makeWASocket({
        version,
        auth: state.creds as AuthenticationCreds,
        printQRInTerminal: false,
        browser: ["TinyClaw", "Chrome", "4.0.0"] as [string, string, string],
        connectTimeoutMs: 30_000,
        retryRequestDelayMs: 2_000,
      });

      socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
          console.log("WhatsApp connected.");
          deps.onConnected?.();
        }

        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.message
            ? (lastDisconnect.error as any)?.output?.statusCode
            : lastDisconnect?.statusCode;
          const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut && !stopped;

          console.log(
            `WhatsApp disconnected (code: ${statusCode}).${shouldReconnect ? " Reconnecting..." : ""}`,
          );

          if (shouldReconnect) {
            await handle.start();
          }
        }
      });

      socket.ev.on("creds.update", saveCreds);

      socket.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;

        for (const msg of m.messages) {
          if (msg.key.fromMe) continue;
          if (!msg.message) continue;

          const jid = msg.key.remoteJid!;

          if (!jid.endsWith("@s.whatsapp.net")) continue;

          const text =
            msg.message.conversation ??
            msg.message.extendedTextMessage?.text ??
            "";

          if (!text.trim()) continue;

          await deps.onMessage({ jid, text: text.trim() });
        }
      });
    },
    stop() {
      stopped = true;
      if (socket) {
        socket.end(undefined);
        socket = null;
      }
    },
  };

  return handle;
}