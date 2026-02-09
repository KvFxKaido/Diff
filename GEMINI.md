# Push

**Mobile-native AI coding agent with direct GitHub repo access.**

Push is a personal chat interface backed by role-based AI agents (Orchestrator, Coder, Auditor) designed for reviewing PRs, exploring codebases, and shipping changes from a mobile device.

## Project Overview

*   **Type:** AI Coding Agent / Web Application (PWA)
*   **Purpose:** Enable developers to manage repositories, review code, and deploy changes via a chat interface on mobile.
*   **Core Philosophy:** Chat-first, repo-locked context, live agent pipeline, rich inline UI (cards).
*   **AI Backend:** Multi-provider support (Kimi, Ollama, Mistral) via OpenAI-compatible SSE streaming.

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Styling** | Tailwind CSS 3, shadcn/ui (Radix primitives) |
| **Backend** | Cloudflare Workers (TypeScript) |
| **Sandbox** | Modal (Serverless Python Containers) |
| **AI Integration** | OpenAI-compatible Streaming (Kimi, Ollama, Mistral) |
| **APIs** | GitHub REST API |

## Architecture

### Role-Based Agents
*   **Orchestrator:** Conversational lead, interprets intent, delegates to Coder.
*   **Coder:** Autonomous code implementation and execution in the sandbox (unbounded loops, 90s timeout).
*   **Auditor:** Pre-commit safety gate. Reviews diffs and issues a binary SAFE/UNSAFE verdict.

### Key Systems
*   **Tool Protocol:** Prompt-engineered JSON tool blocks for GitHub and Sandbox interactions.
*   **Sandbox:** Persistent Linux environment (via Modal) for cloning repos, running tests, and editing files.
*   **Sandbox Mode:** Ephemeral workspace (no GitHub repo). Entry via onboarding or repo picker. GitHub tools blocked; 30-min lifetime with expiry warning. Download as tar.gz.
*   **Browser Tools (Optional):** Sandbox-backed webpage screenshot + text extraction via Browserbase.
*   **Scratchpad:** Shared persistent notepad for user/AI collaboration.
*   **Context Management:** Token-budget rolling window with summarization.

## Directory Structure

```
Push/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/      # Chat UI (Container, Input, Bubbles, SandboxExpiryBanner)
│   │   │   ├── cards/     # Inline UI Cards (PR, Diff, Sandbox Output, SandboxDownloadCard)
│   │   │   └── ui/        # shadcn/ui library
│   │   ├── hooks/         # React hooks (useChat, useSandbox, useGitHubAuth)
│   │   ├── lib/           # Core Logic
│   │   │   ├── orchestrator.ts    # Agent coordination & streaming
│   │   │   ├── coder-agent.ts     # Coder sub-agent loop
│   │   │   ├── auditor-agent.ts   # Auditor safety gate
│   │   │   ├── github-tools.ts    # GitHub API tools
│   │   │   └── sandbox-tools.ts   # Sandbox interaction tools
│   │   ├── sections/      # Main application screens
│   │   ├── types/         # Shared TypeScript definitions
│   │   ├── App.tsx        # Main entry & routing
│   │   └── main.tsx       # React root
│   ├── worker.ts          # Cloudflare Worker (AI & Sandbox Proxy)
│   ├── package.json       # Frontend dependencies & scripts
│   ├── tsconfig.json      # TypeScript configuration
│   └── vite.config.ts     # Vite configuration
├── sandbox/
│   ├── app.py             # Modal Python App (Sandbox Endpoints)
│   └── requirements.txt   # Python dependencies
├── AGENTS.md              # AI Agent Context & Instructions
├── CLAUDE.md              # Detailed Architecture Docs
├── wrangler.jsonc         # Cloudflare Workers Configuration
└── README.md              # Project Documentation
```

## Development & Usage

### Prerequisites
*   Node.js & npm
*   Python (for Modal sandbox deployment)
*   API Keys: Kimi/Ollama/Mistral (AI), GitHub (Auth/API)

### Setup & Run
1.  **Install Frontend Dependencies:**
    ```bash
    cd app
    npm install
    ```
2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
3.  **Build for Production:**
    ```bash
    npm run build
    ```

### Deployment
*   **Cloudflare Worker:** `npx wrangler deploy` (from repo root)
*   **Modal Sandbox:** `cd sandbox && python -m modal deploy app.py`

### Environment
Environment variables are in `app/.env` (local dev) and Cloudflare Worker secrets (production). API keys can also be set via the Settings UI.

## Coding Conventions
*   **TypeScript:** Strict mode enabled. Explicit return types required on exported functions.
*   **Styling:** Use Tailwind CSS via `cn()` utility for class merging.
*   **Components:** Functional components with hooks. PascalCase naming.
*   **State:** Custom hooks for logic encapsulation (`useChat`, `useSandbox`).
*   **Safety:** Auditor defaults to UNSAFE on error. Secrets managed via Cloudflare Worker.
