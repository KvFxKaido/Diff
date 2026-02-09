# Push — AI Agent Context

Mobile-first AI coding agent with direct GitHub repo access. Chat with your codebase — review PRs, explore changes, and ship code from your phone.

## Project Overview

Push is a personal chat interface backed by role-based AI agents. Users select a repo, ask questions, and the agent reads code, analyzes PRs, runs code in a sandbox, and shows results as inline cards — all in a streaming conversation.

**Core Philosophy:**
- Chat-first — conversation is the primary interface
- Repo-locked context — agent only sees the selected repo
- Live pipeline — every agent step visible in real time
- Show, don't dump — rich inline cards instead of walls of text

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Styling | Tailwind CSS 3, shadcn/ui (Radix primitives) |
| AI | Multi-backend: Kimi K2.5, Ollama, Mistral (user picks, all roles) |
| Backend | Cloudflare Workers (TypeScript) |
| Sandbox | Modal (serverless Python containers) |
| APIs | GitHub REST API |

## Architecture

### Role-Based Agent System

The active backend serves all three roles. The user picks a backend in Settings; all agents use it.

| Role | Responsibility |
|------|----------------|
| **Orchestrator** | Conversational lead, interprets intent, delegates to Coder |
| **Coder** | Autonomous code implementation in sandbox (unbounded rounds, 90s timeout per round) |
| **Auditor** | Pre-commit risk review — binary SAFE/UNSAFE verdict (fail-safe) |

### AI Backends

Three providers, all using OpenAI-compatible SSE streaming. Any single API key is sufficient. Provider selection is locked per chat after the first user message. Production uses Cloudflare Worker proxies at `/api/kimi/chat`, `/api/ollama/chat`, `/api/mistral/chat`.

| Provider | Default Model |
|----------|---------------|
| **Kimi For Coding** | k2.5 |
| **Ollama Cloud** | gemini-3-flash-preview |
| **Mistral Vibe** | devstral-small-latest |

### Tool Protocol

Tools are prompt-engineered — the system prompt defines available tools and JSON format. The agent emits JSON tool blocks, the client executes them, injects results as synthetic messages, and re-calls the LLM. Both the Orchestrator and Coder tool loops are unbounded. The Coder has a 90s per-round timeout and 60KB context cap as safety nets.

The Orchestrator can delegate complex coding tasks to the Coder sub-agent via `delegate_coder`. The Coder runs autonomously with its own tool loop in the sandbox, then returns results to the Orchestrator.

### Browser Tools (Optional)

- `sandbox_browser_screenshot` — capture a webpage screenshot and render a preview card
- `sandbox_browser_extract` — extract main text from a URL, with optional `selector:` / `css:` instruction prefixes

Prompt-gated by `VITE_BROWSER_TOOL_ENABLED=true`. Routed through Worker endpoints.

### User Identity

Users set a display name, bio, and GitHub login in Settings. Stored in localStorage via `useUserProfile` hook. Injected into both Orchestrator and Coder system prompts via `buildUserIdentityBlock()`. Bio is escaped to prevent prompt injection.

### Scratchpad

A shared notepad that both the user and AI can read/write. Content persists in localStorage and is always injected into the system prompt. Tools: `set_scratchpad` (replace) and `append_scratchpad` (add).

### Sandbox Mode

Ephemeral workspace with no GitHub repo. Entry via onboarding or repo picker. GitHub tools are blocked; only sandbox tools are available. 30-min container lifetime with expiry warning. Download workspace as tar.gz via header button or `sandbox_download` tool.

### Rolling Window

Context uses a token budget with summarization. Older tool-heavy messages are compacted first, then oldest message pairs are trimmed if needed while preserving critical context.

### Project Instructions (Two-Phase Loading)

When the user selects a repo, the app fetches project instruction files via the GitHub REST API (tries `AGENTS.md`, then `CLAUDE.md` as fallback) and injects the content into the Orchestrator and Coder system prompts. When a sandbox becomes ready later, the app re-reads from the sandbox filesystem (which may have local edits) to upgrade the content.

### Data Flow

1. **Onboard** → Connect via GitHub App (recommended) or GitHub PAT
2. **Pick repo** (or start Sandbox Mode for ephemeral workspace)
3. **Chat** → Ask about PRs, changes, codebase
4. **Tools** → JSON tool blocks → execute against GitHub API or sandbox
5. **Scratchpad** → Shared notepad for ideas/requirements (user + AI can edit)
6. **Sandbox** → Clone repo to container, run commands, edit files
7. **Coder** → Autonomous coding task execution (uses active backend)
8. **Auditor** → Every commit gets safety verdict (uses active backend)
9. **Cards** → Structured results render as inline cards

## Directory Structure

```
Push/
├── AGENTS.md              # This file — AI assistant context
├── CLAUDE.md              # Detailed architecture and conventions
├── wrangler.jsonc         # Cloudflare Workers config
├── app/
│   ├── worker.ts          # Cloudflare Worker — AI proxy + sandbox proxy
│   ├── src/
│   │   ├── App.tsx        # Root component, screen state machine
│   │   ├── components/
│   │   │   ├── chat/      # ChatContainer, ChatInput, MessageBubble, ScratchpadDrawer, SandboxExpiryBanner
│   │   │   ├── cards/     # PRCard, SandboxCard, DiffPreviewCard, SandboxDownloadCard, etc.
│   │   │   ├── filebrowser/  # File browser components
│   │   │   └── ui/        # shadcn/ui component library
│   │   ├── hooks/         # React hooks (useChat, useSandbox, useGitHubAuth, etc.)
│   │   ├── lib/           # Core logic and agent modules
│   │   ├── sections/      # OnboardingScreen, RepoPicker, FileBrowser
│   │   ├── types/index.ts # All shared types
│   │   └── main.tsx       # App entry point
│   ├── package.json
│   └── vite.config.ts
└── sandbox/
    ├── app.py             # Modal Python App — sandbox web endpoints
    └── requirements.txt
```

## Key Files Reference

### Core Logic (lib/)

| File | Purpose |
|------|---------|
| `lib/orchestrator.ts` | SSE streaming, think-token parsing, token-budget context management |
| `lib/github-tools.ts` | GitHub tool protocol, `delegate_coder`, `fetchProjectInstructions` |
| `lib/sandbox-tools.ts` | Sandbox tool definitions |
| `lib/scratchpad-tools.ts` | Scratchpad tools, prompt injection escaping |
| `lib/sandbox-client.ts` | HTTP client for `/api/sandbox/*` endpoints |
| `lib/tool-dispatch.ts` | Unified dispatch for all tools |
| `lib/coder-agent.ts` | Coder autonomous loop (uses active backend) |
| `lib/auditor-agent.ts` | Auditor review + verdict (fail-safe, uses active backend) |
| `lib/workspace-context.ts` | Active repo context builder |
| `lib/providers.ts` | AI provider config and role model mapping |

### Hooks (hooks/)

| File | Purpose |
|------|---------|
| `hooks/useChat.ts` | Chat state, message history, tool execution loop |
| `hooks/useSandbox.ts` | Sandbox session lifecycle |
| `hooks/useScratchpad.ts` | Shared notepad state, localStorage persistence |
| `hooks/useGitHubAuth.ts` | PAT validation, OAuth flow |
| `hooks/useRepos.ts` | Repo list fetching, activity detection |
| `hooks/useActiveRepo.ts` | Active repo selection + persistence |
| `hooks/useUserProfile.ts` | User identity (name, bio, GitHub login) + standalone getter |
| `hooks/useFileBrowser.ts` | File browser state and navigation |

## Coding Conventions

- Strict TypeScript, types centralized in `types/index.ts`, discriminated unions for card types
- Functional React components with custom hooks for data fetching
- Tailwind CSS + shadcn/ui, use `cn()` for class merging
- Gate screens → `sections/`, chat UI → `components/chat/`, cards → `components/cards/`
- Agent modules in `lib/`, export a single `run*()` function
- Tool pattern: `detect*ToolCall()` → `execute*ToolCall()`, unified via `tool-dispatch.ts`
- Components: PascalCase, Hooks: `use` prefix, Types: PascalCase

## Design Principles

1. **Mobile first, not mobile friendly** — Built for phones first
2. **One app, not four** — If you leave the app to finish, it failed
3. **Chat is the interface** — Conversation is primary input
4. **Live pipeline** — Every agent step visible in real time
5. **Write-first mobile** — Auditor earns trust, not access restrictions
6. **Quiet confidence** — Fewer words, structured output
7. **Show, don't dump** — Rich inline cards over text walls

## Security Notes

- API keys never exposed to client in production (Worker proxies all AI calls)
- Auditor gate cannot be bypassed — every commit requires SAFE verdict
- Auditor defaults to UNSAFE on any error (fail-safe design)
- Repo context is hard-locked — Orchestrator only sees selected repo
- Sandbox containers auto-terminate after 30 minutes
- Browser tools validate URL shape/protocol and reject private-network targets
- Scratchpad content is escaped to prevent prompt injection (capped at 50KB)
