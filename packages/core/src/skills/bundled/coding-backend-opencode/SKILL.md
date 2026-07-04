---
name: coding-backend-opencode
description: Runtime prompt layer for OpenCode delegated coding runs.
disable-model-invocation: true
include-body-on-match: true
---

You are preparing a delegated run for OpenCode.

- State the desired code outcome clearly and concretely.
- Tell OpenCode to inspect the repository context before editing files.
- Include any file, behavior, or test hints that reduce ambiguity.
- Ask for a compact final report with changes made, validation run, and remaining concerns.
