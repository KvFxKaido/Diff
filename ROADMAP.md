# Push Roadmap (Canonical)

Last updated: 2026-02-09

This is the single source of truth for active product and engineering direction.

`documents/` is a draft lab for spikes, explorations, and non-final plans.
Only decisions promoted into this file should be treated as implementation commitments.

## How We Use This

1. Draft ideas in `documents/` (untracked is fine).
2. Promote approved work here as concise, actionable items.
3. Keep this file current during execution.
4. Archive completed/abandoned items out of this file to keep it focused.

## Status Legend

- `planned` - approved but not started
- `in_progress` - actively being implemented
- `blocked` - waiting on dependency/decision
- `done` - completed and verified

## Current Priorities

| Item | Status | Scope | Acceptance Criteria |
|---|---|---|---|
| Sandbox Mode v1 | done | Ephemeral Modal workspace for brainstorming/prototyping; primary onboarding entry point; tar.gz download as only export path | User can start sandbox from onboarding (no GitHub auth) or repo picker, edit/run files, and download workspace as tar.gz |
| Repo Sync Reliability | in_progress | Unified auth handling and complete repo pagination for PAT/OAuth + GitHub App paths | No demo fallback when authenticated; repo picker shows all accessible repos across pages |
| Browser Tools Rollout Hardening | planned | Validate browser tool reliability on real mobile networks before broader enablement | Cellular QA complete (iOS + Android), error/latency within target, rollout gate decision recorded |

## Next Up

| Item | Status | Scope | Acceptance Criteria |
|---|---|---|---|
| Sandbox Repo Promotion (v2) | planned | In-app "Create Repo from Sandbox" — upload workspace to new GitHub repo and transition to repo-locked mode | User can promote sandbox to repo without leaving the app; requires solving upload latency and state transition |
| Sandbox Telemetry | blocked | Track creation, expiration, download events | Blocked on choosing an analytics provider; no infrastructure exists yet |
| Roadmap Hygiene Automation | planned | Lightweight template/checklist for promoting `documents/` ideas into this file | New roadmap items consistently include scope + acceptance criteria |

## Decision Log

| Date | Decision | Source |
|---|---|---|
| 2026-02-09 | Root `ROADMAP.md` is canonical; `documents/` is draft space | Team decision in chat |
| 2026-02-09 | Sandbox Mode vision: real ephemeral workspace + explicit promotion paths | `documents/Sandbox mode.md` |
| 2026-02-08 | Sandbox v1 descoped: no in-app repo creation (latency/sync concerns); zip download is the only export path; onboarding entry point is v1 priority | `documents/Sandbox mode.md` revision |
| 2026-02-09 | Sandbox Mode v1 implemented: two entry points, sandbox-specific system prompt, `sandbox_download` tool + card, expiry warning banner, persistent download button in header; export format is tar.gz (not zip) | Implementation session |

## Promotion Checklist (Draft -> Canonical)

An item should be promoted from `documents/` to this roadmap only if all are true:

- problem statement is clear
- v1 scope is bounded
- success criteria are testable
- ownership is clear (person/agent/phase)
- non-goals are explicit

## Notes for AI Collaborators

- Always read `ROADMAP.md` first for current priorities.
- Treat `documents/` as exploratory unless explicitly referenced by a roadmap item.
- If implementation diverges from a draft, update this roadmap with the new decision.
