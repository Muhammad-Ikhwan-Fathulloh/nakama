---
name: coding-delegation
description: Delegate bug fixes, feature implementation, file edits, repository changes, or targeted validation to an external coding agent when the user wants changes made in the current project. Keep ordinary explanation, brainstorming, and non-editing chat local.
include-body-on-match: true
---

Use this skill when the user wants real code work done in the current project: implementing features, fixing bugs, editing files, running targeted validation, or inspecting the repo to make a concrete change.

Keep ordinary conversation local:

- Do not delegate simple explanation, brainstorming, status updates, or product discussion unless code changes are actually needed.
- Do not delegate just because the topic is technical.
- If the user only wants advice or an explanation, answer directly.

When delegating:

1. Summarize the coding task in one concrete instruction block.
2. Include only the context the coding agent needs: target behavior, affected files or areas when known, constraints, and what should be verified.
3. Prefer precise change requests over broad open-ended prompts.
4. If there is a preferred backend or workflow constraint from the user, pass it through.

After the coding agent returns:

- Summarize what changed in plain language.
- Mention what was verified.
- Call out any remaining risks, gaps, or follow-up work.
- If the delegated run failed, explain the failure clearly and decide whether to retry, adjust the prompt, or ask the user.
