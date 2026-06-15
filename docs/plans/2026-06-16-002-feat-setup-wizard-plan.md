---
title: "feat: Multi-step setup wizard (WordPress-style onboarding)"
type: feat
status: completed
date: 2026-06-16
---

# feat: Multi-step setup wizard (WordPress-style onboarding)

## Summary

Replace the current single-page setup form with a WordPress-style multi-step wizard that guides new users through four sequential steps: LLM provider (required), USER.md preferences (optional), Telegram integration (optional), and WhatsApp integration (optional). Optional steps include a "Set up later" skip action. After completing or skipping through the wizard, users land in the chat view. The existing Settings page remains unchanged as the "edit later" destination.

---

## Problem Frame

New users land on a minimal setup page that stacks a provider form and a Telegram card vertically with no progression guidance. There is no USER.md onboarding, no WhatsApp step, and no visual sense of progress. The experience feels flat compared to the guided setup flows users expect from tools like WordPress, where each step is clear, optional steps are marked as skippable, and completion feels deliberate.

---

## Requirements

- R1. The setup wizard presents four steps in order: Provider, USER.md, Telegram, WhatsApp
- R2. The Provider step is required — the user cannot skip or proceed until a provider is configured
- R3. USER.md, Telegram, and WhatsApp steps are optional — each has a "Set up later" skip action that advances to the next step
- R4. A visual progress indicator shows the current step, completed steps, and remaining steps at all times
- R5. After completing or skipping the final step, the user is redirected to the chat view
- R6. The existing Settings page remains untouched and serves as the place to edit all configurations after initial setup
- R7. The SetupGuard continues to redirect unconfigured users to /setup; once a provider is configured, the guard lets users through to the main app (after a page refresh during steps 2-4, the configured user enters the main app and can configure remaining items in Settings)
- R8. Wizard step state is in-memory (no persistence across page refreshes) — matching current behavior
- R9. Each step reuses its existing component (ProviderSetupForm, UserContextSettings, TelegramSettingsCard, WhatsAppSettingsCard) adapted for the wizard layout

---

## Scope Boundaries

- The Settings page is not refactored — it continues to work as-is for post-setup editing
- No new API endpoints are required — all steps use existing endpoints (provider CRUD, USER.md init/write, telegram settings, whatsapp settings)
- No wizard state is persisted to the server or localStorage — step progress is in-memory only
- The SetupGuard logic is adjusted but its redirect behavior remains: no provider → /setup
- The chat page, soul page, and other post-login pages are not modified
- The existing PM2 worker manager and status system are not in scope

### Deferred to Follow-Up Work

- Step-specific validation progress indicators (e.g., showing which optional steps were skipped vs. completed in a summary screen)
- Bulk onboarding API for scripted setup
- Invitation or multi-user onboarding flows

---

## Context & Research

### Relevant Code and Patterns

- `apps/web/src/pages/SetupWizardPage.tsx` — current single-page setup (provider card + Telegram card)
- `apps/web/src/components/SetupGuard.tsx` — route guard that redirects to /setup when no provider
- `apps/web/src/components/SetupLayout.tsx` — centered layout wrapper used by the setup page
- `apps/web/src/components/ProviderSetupForm.tsx` — provider selection form with `onSuccess` callback and `submitLabel` prop
- `apps/web/src/components/UserContextCard.tsx` — USER.md editor with `useUserContextQuery`, `useInitUserContextMutation`, `useWriteUserContextMutation` hooks
- `apps/web/src/components/TelegramSettingsCard.tsx` — has `embedded` prop and `onSaveSuccess` callback
- `apps/web/src/components/WhatsAppSettingsCard.tsx` — has `embedded` prop and `onSaveSuccess` callback
- `apps/web/src/lib/navigation.ts` — page route constants, `SETUP_PATH = "/setup"`
- `apps/web/src/App.tsx` — route definitions; /setup is outside the SetupGuard wrapper
- `apps/web/src/context/app-context.tsx` — provides `health.providerConfigured` flag
- `packages/core/src/user-context.ts` — `initUserContext()`, `writeUserContext()`, `getUserContextStatus()` server-side functions
- `packages/core/src/contract.ts` — `UserContextStatusResponse`, `UpdateUserContextRequest`, `InitUserContextResponse` types

### Institutional Learnings

- No relevant learnings in `docs/solutions/` — the directory does not exist yet

### External References

- None; multi-step wizard is a well-established UI pattern with sufficient local examples

---

## Key Technical Decisions

- **Step order: Provider first** — The Provider step is the system gate (no provider = no chat). USER.md follows, then Telegram, then WhatsApp. This matches the user's confirmed preference and prevents a broken state where the user has messaging channels but no AI backend.
- **Wizard state: React component state** — No URL-based step routing or localStorage. A `currentStep` state variable in the wizard component drives which step renders. Simpler than URL routing for a linear flow; matches the "current behavior is fine" decision.
- **Reuse existing components** — Each step wraps its existing form/card component, adapting props (`embedded`, `onSaveSuccess`, `submitLabel`) for the wizard layout. This avoids duplicating form logic and keeps Settings and Wizard in sync.
- **Completion gate on provider only** — The SetupGuard still redirects when `providerConfigured === false`. The wizard suppresses the auto-redirect after provider configuration so the user can continue through remaining steps. Only explicit "Continue to Chat" or completing the last step triggers navigation away from /setup.
- **"Set up later" = advance step** — Skipping an optional step simply increments `currentStep`. No tracking of which steps were skipped; the Settings page handles any future configuration.

---

## Open Questions

### Resolved During Planning

- Step order: Provider first (confirmed by user)
- Optional steps are skippable with "Set up later" (confirmed by user)
- State persistence: in-memory only, matching current behavior (confirmed by user)

### Deferred to Implementation

- Exact wording of step labels, descriptions, and skip buttons
- Visual treatment of the progress indicator (numbered steps vs. named steps, icon choices)
- Whether the USER.md step auto-initializes the template or shows a blank editor

---

## Output Structure

```
apps/web/src/
  components/
    setup-wizard/
      SetupWizard.tsx            — wizard orchestrator component
      SetupWizardStepper.tsx     — step progress indicator
      SetupStepProvider.tsx      — step 1 wrapper
      SetupStepUserContext.tsx   — step 2 wrapper
      SetupStepTelegram.tsx      — step 3 wrapper
      SetupStepWhatsApp.tsx      — step 4 wrapper
  pages/
    SetupWizardPage.tsx          — rewritten to use SetupWizard
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Wizard step state machine:**

```
Step 1 (Provider) ──required──▶ Step 2 (USER.md) ──optional──▶ Step 3 (Telegram) ──optional──▶ Step 4 (WhatsApp)
      │                              │ skip                          │ skip                      │
      │ can't skip                   ▼                              ▼                           ▼
      │                         "Set up later"              "Set up later"              "Set up later" → /chat
      ▼
  (must complete)
```

- The wizard renders one step at a time, controlled by a `currentStep` state (1-4)
- The stepper shows all four steps with visual indicators: completed (checkmark), current (highlighted), upcoming (muted)
- Step 1 blocks until `ProviderSetupForm.onSuccess` fires
- Steps 2-4 each render a "Set up later" link/button that calls `onNext()`
- Steps 2-4 each call `onNext()` on their save-success callback
- After Step 4 (or its skip), the wizard navigates to /chat
- The `SetupGuard` continues to redirect provider-less users to /setup, but the wizard page intercepts the `providerConfigured` effect to prevent premature redirect during steps 2-4

---

## Implementation Units

### U1. Create the SetupWizard orchestrator and stepper components

**Goal:** Build the wizard shell — a stepper progress indicator and an orchestrator that manages `currentStep` state, renders the active step, and provides `onNext`/`onSkip`/`onBack` callbacks to child steps.

**Requirements:** R4, R8

**Dependencies:** None

**Files:**
- Create: `apps/web/src/components/setup-wizard/SetupWizard.tsx`
- Create: `apps/web/src/components/setup-wizard/SetupWizardStepper.tsx`

**Approach:**
- `SetupWizard` manages `currentStep` (1-4) state and renders the active step component
- Provides `onNext()`, `onSkip()`, `onBack()` callbacks to child steps
- `onNext` and `onSkip` both advance `currentStep`; `onBack` decrements it
- After Step 4 completes or is skipped, calls `onComplete()` which navigates to /chat
- `SetupWizardStepper` renders four step indicators showing: completed (check icon), current (highlighted), upcoming (muted). Each step shows a short label (Provider, About You, Telegram, WhatsApp)
- Step 1 stepper item is visually distinct (required badge or similar)

**Patterns to follow:**
- `SegmentedTab` pattern from `apps/web/src/pages/SoulPage.tsx` for consistent tab/step UI styling
- `SetupLayout` wrapper from `apps/web/src/components/SetupLayout.tsx` for the centered layout

**Test scenarios:**
- **Happy path: stepper renders four steps** — all four steps appear, Step 1 is active, Steps 2-4 are upcoming
- **Happy path: step advances** — calling `onNext` or `onSkip` increments the active step
- **Happy path: step goes back** — calling `onBack` decrements the active step, minimum is 1
- **Happy path: completion fires after last step** — after Step 4 advances, `onComplete` callback fires (triggers navigation to /chat)
- **Edge case: skip from Step 1 does not advance** — Step 1 is required; skip button is not rendered

**Verification:** Storybook or manual render of SetupWizard and SetupWizardStepper; step transitions work correctly in isolation

---

### U2. Create step wrapper components for each wizard step

**Goal:** Wrap the existing form/card components for each of the four steps, adapting their props and layout for the wizard context (embedded mode, success callbacks that advance the wizard, skip buttons on optional steps).

**Requirements:** R2, R3, R9

**Dependencies:** U1

**Files:**
- Create: `apps/web/src/components/setup-wizard/SetupStepProvider.tsx`
- Create: `apps/web/src/components/setup-wizard/SetupStepUserContext.tsx`
- Create: `apps/web/src/components/setup-wizard/SetupStepTelegram.tsx`
- Create: `apps/web/src/components/setup-wizard/SetupStepWhatsApp.tsx`

**Approach:**
- **SetupStepProvider** wraps `ProviderSetupForm` with `submitLabel="Continue"` and `onSuccess` calling the wizard's `onNext()`. No skip action.
- **SetupStepUserContext** wraps `UserContextSettings` adapted for wizard embedding. If USER.md is not initialized, shows the init/create flow; if already present, shows the edit flow. Has a "Set up later" link that calls `onSkip()`. Save success calls `onNext()`. Note: `UserContextSettings` currently lacks an `onSaveSuccess` prop (unlike `TelegramSettingsCard` and `WhatsAppSettingsCard` which expose `embedded` and `onSaveSuccess`). The step wrapper needs to add an `onSaveSuccess` callback prop to `UserContextSettings` (following the same pattern), and the `handleInit` success path (template creation) also needs to call it to advance the wizard step when the user creates their USER.md.
- **SetupStepTelegram** wraps `TelegramSettingsCard` in `embedded` mode with `onSaveSuccess` calling `onNext()`. Has a "Set up later" link that calls `onSkip()`.
- **SetupStepWhatsApp** wraps `WhatsAppSettingsCard` in `embedded` mode with `onSaveSuccess` calling `onNext()`. Has a "Set up later" link that calls `onSkip()`.
- Each wrapper receives `onNext`, `onSkip`, `onBack` props from the wizard orchestrator
- The "Set up later" and "Back" actions are rendered consistently across optional steps

**Patterns to follow:**
- `ProviderSetupForm` prop interface: `submitLabel`, `showHeading`, `density`, `onSuccess`
- `TelegramSettingsCard` prop interface: `embedded`, `submitLabel`, `onSaveSuccess`
- `WhatsAppSettingsCard` prop interface: `embedded`, `submitLabel`, `onSaveSuccess`
- `UserContextCard.UserContextSettings` — needs adaptation for wizard embedding (currently a settings-row component; may need a standalone-card variant)

**Test scenarios:**
- **Happy path: Provider step calls onNext on save** — ProviderSetupForm onSuccess triggers wizard advance
- **Happy path: USER.md step calls onNext on save** — saving USER.md triggers wizard advance
- **Happy path: USER.md step calls onSkip** — "Set up later" advances without saving
- **Happy path: Telegram step calls onNext on save** — save triggers advance
- **Happy path: WhatsApp step calls onSkip** — "Set up later" advances without saving
- **Edge case: Provider step has no skip button** — skip action is not rendered for the required step

**Verification:** Each step wrapper renders correctly with its embedded component; callbacks advance or skip as expected

---

### U3. Rewrite SetupWizardPage to use the multi-step wizard

**Goal:** Replace the current single-page setup with the multi-step wizard, suppress the auto-redirect after provider configuration so the user can continue through remaining steps, and navigate to /chat on wizard completion.

**Requirements:** R5, R7

**Dependencies:** U1, U2

**Files:**
- Modify: `apps/web/src/pages/SetupWizardPage.tsx`
- Modify: `apps/web/src/components/SetupGuard.tsx`

**Approach:**
- Rewrite `SetupWizardPage` to render `SetupWizard` inside `SetupLayout`
- Remove the current `useEffect` that redirects on `providerConfigured` — the wizard itself controls when to navigate away
- The wizard's `onComplete` callback navigates to /chat (using `useNavigate`)
- When the wizard is on steps 2-4 and the user already has a provider, `providerConfigured` is true but the wizard should not redirect — this is handled by the wizard's own step state, not the auto-redirect effect
- Update `SetupGuard`: no structural change needed — it still redirects when `providerConfigured === false`. The wizard page is outside the guard (already the case in App.tsx routing). The key change is removing the `useEffect` auto-redirect from `SetupWizardPage`, since the wizard controls navigation explicitly
- If a user with a configured provider visits /setup directly (bookmark, back button, manual URL), the ChatPage redirect from SetupGuard takes effect immediately since `providerConfigured === true` — they enter the main app and use Settings for any remaining configuration. The wizard is not re-shown to returning users
- If a user refreshes mid-wizard (after Step 1), provider is configured → SetupGuard lets them through to the main app (expected — they can configure remaining items in Settings)

**Patterns to follow:**
- Current `SetupWizardPage` routing pattern from `apps/web/src/pages/SetupWizardPage.tsx`
- `pathForPage("chat")` from `apps/web/src/lib/navigation.ts` for navigation target
- Current `SetupGuard` pattern — keep existing structure, only modify `SetupWizardPage`

**Test scenarios:**
- **Happy path: wizard renders on /setup** — visiting /setup when no provider is configured shows the wizard starting at Step 1
- **Happy path: wizard advances through all steps** — completing provider, then skipping/finishing USER.md, Telegram, WhatsApp lands on /chat
- **Happy path: skip all optional steps** — after provider setup, skipping USER.md, Telegram, and WhatsApp lands on /chat
- **Edge case: refresh after Step 1** — provider is configured, SetupGuard lets user into main app (wizard is not re-shown)
- **Edge case: visiting /setup with provider already configured** — SetupGuard detects `providerConfigured === true` and redirects to the main app immediately. The wizard does not re-render for returning users.

**Verification:** Full wizard flow from /setup through all four steps to /chat works end-to-end; navigating away and back behaves correctly

---

### U4. Polish wizard transitions and responsive layout

**Goal:** Ensure the wizard looks polished with smooth step transitions, responsive layout, and consistent visual treatment across all steps.

**Requirements:** R4

**Dependencies:** U3

**Files:**
- Modify: `apps/web/src/components/setup-wizard/SetupWizard.tsx`
- Modify: `apps/web/src/components/setup-wizard/SetupWizardStepper.tsx`
- Modify: `apps/web/src/components/SetupLayout.tsx`

**Approach:**
- Add step-transition animations in `SetupWizard` (fade or slide between steps)
- Ensure `SetupLayout` provides adequate vertical spacing for the stepper + content
- Verify responsive behavior: stepper collapses to a compact format on mobile (icons only or condensed labels)
- Add a "Welcome to TinyClaw" heading and brief subtitle on Step 1 above the stepper
- Steps 2-4 show a shorter contextual heading (e.g., "Tell us about yourself", "Connect Telegram", "Connect WhatsApp")
- The "Set up later" action is styled as a subtle link/button below each optional step's content, not a prominent button

**Patterns to follow:**
- `SetupLayout` max-width constraint (`max-w-3xl` from current layout)
- Existing card and form styling patterns from `ProviderSetupForm`, `TelegramSettingsCard`, `WhatsAppSettingsCard`
- Tailwind CSS 4 utilities already in use across the codebase

**Test scenarios:**
- **Happy path: stepper renders correctly at all breakpoints** — desktop shows full labels; mobile shows compact format
- **Happy path: step transitions are smooth** — moving between steps shows a fade or slide transition
- **Happy path: headings are contextual per step** — Step 1 says "Welcome to TinyClaw", Steps 2-4 have relevant headings
- **Edge case: long content in Telegram/WhatsApp steps** — forms with pairing codes and QR codes scroll correctly within the wizard

**Verification:** Visual check at desktop and mobile breakpoints; transition animations work smoothly

---

## System-Wide Impact

- **Interaction graph:** The wizard page (`/setup`) and `SetupGuard` are the only entry points affected. All other routes and pages remain unchanged.
- **Error propagation:** Form errors within each step component already handle their own error states. The wizard adds no cross-step error dependencies.
- **State lifecycle:** Wizard step state is in-memory only (component state). No server-side state is added. Refreshing the page after Step 1 means the user enters the main app (provider configured) and can configure remaining items in Settings — this is the expected behavior.
- **API surface parity:** No new API endpoints. All wizard steps use existing endpoints (provider, USER.md, telegram settings, whatsapp settings).
- **Unchanged invariants:** The Settings page, chat page, soul page, profiles page, and all other post-login pages are not modified. The existing card components (`TelegramSettingsCard`, `WhatsAppSettingsCard`, `ProviderSetupForm`, `UserContextSettings`) continue to work in their current locations.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `UserContextSettings` is a row-level component embedded in a Card in Settings — adapting it for wizard standalone use may require extracting or wrapping | Start by wrapping it in a Card within the step wrapper; extract only if the embedded layout feels awkward |
| Page refresh during wizard loses step position | This matches current behavior (in-memory state). After refresh with provider configured, user enters main app and configures remaining items in Settings — acceptable per user confirmation |
| Telegram/WhatsApp step content (pairing codes, QR codes) may make the wizard step feel long | Scrollable step content area within SetupLayout; stepper stays fixed at top |
| `SetupGuard` timing — health check may not have `providerConfigured` immediately after Step 1 save | The wizard suppresses the auto-redirect effect and manages navigation explicitly; the guard is only evaluated on fresh page loads |

---

## Documentation / Operational Notes

- Update `FEATURES.md` if it exists to describe the multi-step wizard onboarding flow
- No new API endpoints, no database changes, no migration required