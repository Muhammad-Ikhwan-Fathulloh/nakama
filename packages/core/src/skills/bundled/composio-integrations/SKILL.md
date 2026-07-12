---
name: composio-integrations
description: Use Composio-connected SaaS tools safely. Connect missing apps on Integrations; never self-authorize OAuth in chat.
---

# Composio integrations

Use assigned Composio tools when the user asks for external SaaS actions (email, Slack, GitHub, Notion, etc.).

## Rules

- Never attempt OAuth or open connect links yourself in chat.
- If a Composio tool returns `COMPOSIO_NOT_CONNECTED`, tell the user to open **Integrations → Composio** and connect the toolkit with their own account, then retry.
- Only use Composio tools that are assigned to this profile.
- Do not invent successful external actions when a tool fails.

## When to use

- The user wants to read or write data in a connected SaaS app.
- The task clearly needs an assigned Composio toolkit.

## When not to use

- Builtin tools, MCP tools, or file/bash tools already cover the task.
- The user asks you to perform OAuth — direct them to Integrations instead.
