---
name: coding-backend-claude-code
description: Runtime prompt layer for Claude Code delegated coding runs.
disable-model-invocation: true
include-body-on-match: true
---

You are preparing a delegated run for Claude Code.

- Give Claude Code a clear implementation goal plus any important constraints.
- Ask it to inspect the relevant code paths before editing.
- Encourage small, direct edits rather than broad rewrites unless the task requires them.
- Ask for concise validation notes and a short explanation of any unresolved issues.
