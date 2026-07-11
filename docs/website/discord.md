# Discord

Nakama can run as a Discord bot so you can chat with the same agent from DMs, server channels, or threads.

The mental model is simple:

- Discord is a **channel** for Nakama
- The bridge talks to the same Nakama server as the web app
- Pairing links a real Discord user to your Nakama access

## What Discord supports

With Discord enabled, users can:

- chat with a Nakama profile in a private DM
- use the bot in server channels and threads after DM pairing
- switch org and profile with commands
- stop, clear, compact, or restart conversations
- receive streaming replies with typing indicators and live todo progress

Discord currently supports **text messages only**. Attachments and voice are not forwarded to the agent.

## Step 1: Create a Discord bot

Every Discord setup starts with a bot token from the [Discord Developer Portal](https://discord.com/developers/applications).

1. Open the portal and create a new application
2. Open **Bot** in the sidebar
3. Click **Reset Token** or **Add Bot**, then copy the bot token
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**
5. Open **OAuth2 → URL Generator**
6. Select scopes `bot` and `applications.commands`
7. Select permissions your server needs (at minimum: Send Messages, Read Message History)
8. Open the generated invite URL and add the bot to your server

Keep the token secret. Anyone with the token can control your Discord bot.

**Message Content Intent** is required for guild messages. If you change intents after inviting the bot, re-invite it so Discord applies the new setting.

## Step 2: Save Discord settings in Nakama

Open **Integrations → Discord** in the Nakama web app, then:

1. Paste the bot token
2. Choose the default Nakama profile for Discord replies
3. Save

When you save for the first time, Nakama generates a pairing code for linking your Discord account.

## Step 3: Pair your Discord account

Pairing is required so random Discord users cannot talk to your internal Nakama bot.

1. Copy the pairing code from **Integrations → Discord**
2. Open a private DM with your bot
3. Send the pairing code as a normal text message

After a successful match, that Discord user is linked and the pairing code is cleared.

### Why pairing exists

The bot token only connects Nakama to Discord.

Pairing connects **your Discord user account** to Nakama permissions.

That means Nakama can:

- identify which Discord user is talking
- allow private chat safely
- apply the right org and profile access

Server channels require DM pairing first. If an unlinked user tries to use the bot in a server, Nakama asks them to link in a private DM.

## Step 4: Start the Discord bridge

For local development, start it from the repo root:

```bash
bun run dev:discord
```

The bridge connects to Discord and forwards messages to your Nakama server.

If the Nakama server is not already running, the bridge will try to start it.

For production, start the Discord bridge worker from the **Integrations** page in the Nakama web app instead of using the dev command.

## Optional: Direct allowlist instead of pairing

Nakama also supports allowlisting Discord user IDs directly.

This is useful when you want to pre-authorize specific users without the one-time pairing flow.

To add users from the dashboard:

1. Open **Integrations → Discord**
2. In **Allowed users**, click **Manage**
3. Paste a Discord user snowflake ID and click **Add**

Use the numeric Discord user ID (snowflake), not the `@username`.

You can also configure allowed users through `DISCORD_ALLOWED_USER_IDS` for environment-based deployments.

## Private chat behavior

Private chat is the simplest mode.

Once paired or allowlisted:

- normal messages go to the Nakama agent
- the bot keeps a Discord chat session
- slash commands work immediately

If an unlinked user opens the bot, Nakama asks for the pairing code instead of sending the message to the agent.

## Server and thread behavior

Nakama supports Discord servers, but it is intentionally conservative about when it replies.

In a server channel, the bot responds only when the message is:

- a slash command from Discord's command menu
- a reply to one of the bot's messages
- a direct `@mention` of the bot

This keeps server channels usable without making the bot noisy.

### Threads and profiles

In Discord threads, each thread keeps its own Nakama session.

- `/profile` inside a thread changes only that thread
- new threads use the default Discord profile until you switch them
- `/profile` in the main channel changes the channel-level profile
- `/org` stays channel-level, so switch org first if a thread needs a profile from another org

Replies in server channels are visible to everyone in that channel. Nakama prefixes those messages so the agent knows the reply is public.

## Discord commands

Session control uses Discord slash commands. Org and profile switching use text commands.

| Command | Type | What it does |
| --- | --- | --- |
| `/start` | Slash | Welcome and pairing help |
| `/help` | Slash | Show command help |
| `/stop` | Slash | Stop the current in-progress reply |
| `/clear` | Slash | Clear chat history |
| `/compact` | Slash | Compact conversation history |
| `/new` | Slash | Start a new conversation |
| `/status` | Slash | Show server and model status |
| `/org` | Text | Choose or switch organization |
| `/profile` | Text | Choose or switch profile |

In servers, `@mention` the bot or reply to it to chat. Complete DM pairing first.

## Reply formatting

Agents can write normal Markdown-style replies. Nakama sends them as plain Discord text and splits long replies into multiple messages when needed.

Discord has a 2000-character limit per message. Nakama automatically chunks longer replies.

## Configuration notes

Nakama stores Discord bridge settings under its local config directory (default `~/.nakama/discord/`).

Important values include:

- bot token
- default Discord profile
- pairing code
- paired user IDs
- allowed user IDs from the dashboard allowlist

Environment-based setup is also supported. The main env var is:

```text
DISCORD_BOT_TOKEN
```

Nakama also supports:

```text
DISCORD_ALLOWED_USER_IDS
nakama_DISCORD_PROFILE_ID
```

Override the config root with `NAKAMA_CONFIG_DIR` when needed.

## Troubleshooting

### The bot does not answer at all

Check these first:

1. The bot token is saved correctly
2. `bun run dev:discord` is running (or the bridge worker is started from Integrations)
3. The Nakama server is running
4. The Discord user is paired or allowlisted

### Private chat works but server channels do not

Usually one of these is true:

- **Message Content Intent** is not enabled in the Discord Developer Portal
- the bot was invited before Message Content Intent was enabled
- the message was not a slash command, reply, or direct `@mention`
- the user has not completed DM pairing yet

### Mentions do not work in servers

Check these:

1. Enable **Message Content Intent** in the Discord Developer Portal
2. Re-invite the bot after changing intents
3. Make sure only one Discord bridge worker is running
4. `@mention` the bot or reply to one of its messages

### Discord says to link in a private DM

This usually means:

- the user never sent the pairing code
- the pairing code expired or was replaced
- the user tried to pair in a server channel instead of a DM

Generate a new pairing code from **Integrations → Discord** and send it to the bot in a private DM.

## Next steps

- [Getting Started](/getting-started)
- [Profiles](/profiles)
- [Telegram](/telegram)
- [WhatsApp](/whatsapp)
