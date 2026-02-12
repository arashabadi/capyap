# Capyap Product Overview + UI Design Brief (Lightweight)

Use this document as a single input to an LLM for designing the graphical UI page by page.

## 1) Product Snapshot

### Name
Capyap Local Agent

### One-line purpose
Turn any YouTube video (or transcript file) into a citation-grounded Q/A workspace with timestamp evidence.

### Core value
- Fast answers from long videos
- Evidence links with timestamps
- Local-first usage with user-controlled LLM provider

### Current stack (already implemented)
- Backend: FastAPI + LangGraph
- Frontend: React + Vite
- Desktop: Tauri (macOS/Windows/Linux)
- Local storage: JSON settings + transcript cache

### Primary user types
- Non-coder learners (students, researchers, creators)
- Power users with custom/local model endpoints

## 2) Product Goals

### Main goals
- Make setup non-technical (paste key once, start asking)
- Keep trust high (always show transcript evidence)
- Keep app light and fast (minimal screens, low cognitive load)

### Non-goals (for MVP)
- Heavy analytics dashboards
- Enterprise admin controls
- Large plugin marketplace UI

## 3) UX Principles (Keep It Very Light)

- One primary action per page
- Clear next step on every screen
- Minimal chrome, low visual noise
- Mobile-safe responsive layout
- Avoid deep menus; max 2 levels of navigation
- Show progress and errors in plain language

## 4) Information Architecture

- Page 1: Welcome + Onboarding
- Page 2: Source Loader (YouTube URL / local transcript file)
- Page 3: Ask Workspace (single-turn + cited answer)
- Page 4: Talk to Agent Popup (multi-turn)
- Page 5: Settings (provider/model/performance)

## 5) Functional Requirements by Page

## Page 1: Welcome + Onboarding
- Inputs:
  - Provider name
  - Base URL
  - Model
  - API token (optional local save)
  - Token env variable name
  - Retrieval defaults (top-k, chunk size, languages)
- Actions:
  - Validate and save settings
  - Continue to workspace
- States:
  - Empty/new user
  - Saving
  - Save success
  - Validation/API failure

## Page 2: Source Loader
- Inputs:
  - YouTube URL/ID or local `.txt` path
- Actions:
  - Load transcript
  - Show source metadata (id, chunks, words)
- States:
  - Idle
  - Loading
  - Loaded
  - Error (invalid URL, missing transcript, fetch failure)

## Page 3: Ask Workspace
- Inputs:
  - Single question text area
- Outputs:
  - Answer text
  - Citation list with chunk id + timestamp range + excerpt
- Actions:
  - Ask agent
  - Jump to YouTube timestamp via link
- States:
  - Asking
  - Answer ready
  - No evidence / weak evidence
  - Error

## Page 4: Talk to Agent Popup
- Trigger:
  - Floating “Talk to Agent” button
- Behavior:
  - Opens chat panel above current page
  - Keeps recent conversation turns
  - Each assistant response can include citations
- Actions:
  - Send follow-up questions
  - Close/reopen without losing current session state

## Page 5: Settings
- Edit:
  - Provider/base URL/model/token settings
  - Retrieval defaults
- Actions:
  - Save
  - Reset to defaults
  - Optional “test connection”

## 6) Shared Components

- Top bar: product title + settings shortcut
- Source status chip: shows loaded source
- Citation card: `[chunk-N]`, timestamp range, excerpt, open-link action
- Error banner: plain language + retry action
- Loading states: skeleton or minimal spinner with one sentence

## 7) Visual Direction (Lightweight)

- Style: clean, calm, productive
- Density: medium-compact (desktop), spacious touch targets (mobile)
- Color usage: 1 primary, 1 accent, neutral scale
- Typography: legible sans-serif, strong hierarchy
- Motion: subtle, purposeful, <200ms transitions
- Accessibility:
  - Keyboard-navigable forms and chat
  - Contrast-safe text/buttons
  - Clear focus states

## 8) Design Constraints for LLM

- Keep implementation lightweight:
  - No large UI framework requirement
  - Reuse small component primitives
  - Avoid heavy animations/illustration bundles
- Compatible with:
  - React + Vite frontend
  - Tauri desktop wrapper
  - Localhost backend API

## 9) API Contracts (UI-facing)

- `GET /api/settings`
- `POST /api/settings`
- `POST /api/transcripts/load`
- `POST /api/agent/chat`
- `GET /health`

## 10) Output Request to a UI-Design LLM (Copy/Paste)

You can paste the prompt below directly:

```text
You are a senior product designer and frontend UX architect.

Design a lightweight, production-ready UI for a local-first app called "Capyap Local Agent".
Purpose: users load a YouTube video/transcript and ask questions answered with timestamp citations.

Tech constraints:
- Frontend: React + Vite
- Desktop shell: Tauri
- Keep bundle and visual complexity light
- Mobile and desktop responsive

Design the app page by page:
1) Welcome + Onboarding
2) Source Loader
3) Ask Workspace
4) Talk to Agent Popup
5) Settings

For each page provide:
- page goal
- content hierarchy
- exact components
- interaction flows and states (idle/loading/success/error)
- accessibility notes
- concise copywriting

Then provide:
- a shared design system token set (color/type/spacing/radius/shadow)
- a component inventory
- a final click-path user journey from first launch to first cited answer

Constraints:
- prioritize simplicity and trust
- emphasize citations and timestamp evidence
- avoid heavy UI patterns and keep it visually calm
- no unnecessary pages
```

## 11) Acceptance Checklist for Proposed UI

- New user reaches first answer in <= 2 minutes
- Citation links are obvious and one-click
- Onboarding requires no coding knowledge
- Layout works at 360px width and desktop
- No page feels overloaded or visually heavy
