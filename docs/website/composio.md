# Composio

Nakama integrates with [Composio](https://composio.dev) to give agents access to external SaaS tools with managed OAuth.

Nakama uses the Composio SDK (`@composio/core`) with a **hybrid** model: org admins curate which toolkits are allowed; each member connects their own accounts.

## API key

Nakama needs a **project API key** for the Composio SDK (`x-api-key`).

| Key | Where to find it | Used by Nakama? |
| --- | --- | --- |
| Project API key | [Composio dashboard](https://dashboard.composio.dev) → **Settings** → **Project Settings** → **API Keys** | Yes |
| MCP consumer key (`ck_…`) | Dashboard → **AI Clients** → select client | No |

See [Composio authentication docs](https://docs.composio.dev/reference/authentication) for details.

The key is stored in `~/.nakama/composio/config.ini` on the Nakama server.

## Setup

1. As an org admin, open **Integrations → Composio** and save your Composio **project API key**.
2. Confirm `/health` reports `composioConfigured: true` and `composioAvailable: true`.
3. As an org admin, **enable** a toolkit for the organization.
4. As any org member, click **Connect your account** and complete OAuth in the browser.
5. Click **Sync tools** after connecting.
6. Assign the toolkit to a profile on the **Profiles** page.

## Tenancy model

- **Org catalog:** which SaaS toolkits are permitted (`enabled` / `disabled` per org).
- **User connections:** each member's OAuth lives in `composio_user_connections`; Composio `user_id` is `nakama:user:{userId}`.
- Chat uses the **chatting user's** connected accounts for assigned toolkits.
- Org admins enable/disable toolkits and assign them to profiles. Members connect their own accounts.

## Upgrades

If you used org-shared connections before this model, existing connected toolkits are migrated to the first org admin's user connection on database startup. Other members should connect their own accounts on Integrations.

## Chat behavior

- Assigned Composio tools are namespaced as `composio__{toolkit}__{tool}`.
- Auth failures return `COMPOSIO_NOT_CONNECTED` with guidance to connect on Integrations.
- Automations without a user context do not resolve personal Composio tools.

## Related docs

- [MCP servers](/mcp) — generic MCP integration (separate from Composio)
- [Integrations](/integrations) — other bridge and channel settings
