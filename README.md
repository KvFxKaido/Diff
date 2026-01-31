# Diff

A mobile-first, client-side web app that analyzes GitHub Pull Requests using AI. Enter a repo and PR number, get a structured code review with risk assessment, diff notes, and complexity hotspots — all from your phone.

## Overview

Diff is built for quick judgment passes: open a PR on your phone, get a clear answer on whether it's safe to merge, and move on. It uses Ollama Cloud for AI analysis and the GitHub REST API for data fetching. No backend required (except an optional OAuth proxy for private repos).

**Key capabilities:**

- Risk assessment with severity levels (low / medium / high)
- Annotated diff notes classified by type (logic, mechanical, style)
- Complexity hotspot detection
- Demo mode with mock data when API keys aren't configured
- Installable PWA with offline support

## Tech Stack

| Layer | Tools |
|-------|-------|
| Framework | React 19, TypeScript 5.9 |
| Build | Vite 7 |
| Styling | Tailwind CSS 3, shadcn/ui (Radix UI primitives) |
| Forms | React Hook Form, Zod |
| APIs | GitHub REST API, Ollama Cloud |
| PWA | Service Worker, Web App Manifest |

## Getting Started

### Prerequisites

- Node.js v18+
- npm

### Install and Run

```bash
cd app
npm install
npm run dev
```

The app runs in demo mode by default. To enable real analysis, create a `.env` file in `app/`:

```env
VITE_OLLAMA_CLOUD_API_KEY=your_api_key         # Required for AI analysis
VITE_OLLAMA_CLOUD_API_URL=your_api_url         # Optional — defaults to Ollama Cloud
VITE_GITHUB_TOKEN=your_github_token            # Optional — higher GitHub rate limits
VITE_GITHUB_CLIENT_ID=your_client_id           # Optional — enables OAuth login
VITE_GITHUB_OAUTH_PROXY=https://your-proxy.example.com/oauth/github
```

### Scripts

```bash
npm run dev       # Start dev server
npm run build     # Type-check and build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Project Structure

```
Diff/
├── CLAUDE.md           # AI assistant context
├── README.md           # This file
├── Roadmap.md          # Product roadmap and design principles
└── app/                # Application source
    ├── public/         # PWA assets (manifest, service worker)
    ├── src/
    │   ├── components/ui/   # shadcn/ui component library
    │   ├── hooks/           # React hooks (GitHub API, analysis, auth)
    │   ├── lib/             # API clients and utilities
    │   ├── sections/        # Screen components (Home, Running, Results)
    │   ├── types/           # TypeScript type definitions
    │   ├── App.tsx          # Root component and screen routing
    │   └── main.tsx         # Entry point
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

## How It Works

1. **Input** — Provide a GitHub repository and PR number
2. **Fetch** — The app retrieves PR metadata, changed files, and the unified diff via the GitHub API
3. **Analyze** — The diff is sent to Ollama Cloud with a structured review prompt
4. **Display** — Results are rendered in collapsible sections: summary, risks, diff notes, and hotspots

## Architecture

The app follows a role-based agent model described in [Roadmap.md](Roadmap.md):

- **Orchestrator** — Intent routing and workflow sequencing
- **Coder** — Implementation and code edits
- **Auditor** — Deterministic analysis and pre-commit review
- **Interpreter** — Ambiguity resolution and input normalization

All AI runs through Ollama Cloud (flat subscription, no token metering).

## Design Principles

- **Mobile first** — Built for one-handed phone use; desktop is secondary
- **One app, not four** — Replaces GitSync, GitHub mobile, Claude, and Codex
- **Live pipeline** — Every action visible in real time
- **One action per screen** — No dense dashboards
- **Quiet confidence** — Structured output with clear uncertainty labeling
- **Zero-friction start** — Demo mode works with no configuration

## License

This project is private and not currently licensed for redistribution.
