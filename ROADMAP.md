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
| Sandbox Mode v1 | planned | Ephemeral Modal workspace for brainstorming/prototyping; explicit promotion to download zip or create repo | User can start sandbox, edit/run files, and explicitly choose `Keep Exploring`, `Download Files`, or `Create Repo` |
| Repo Sync Reliability | in_progress | Unified auth handling and complete repo pagination for PAT/OAuth + GitHub App paths | No demo fallback when authenticated; repo picker shows all accessible repos across pages |
| Browser Tools Rollout Hardening | planned | Validate browser tool reliability on real mobile networks before broader enablement | Cellular QA complete (iOS + Android), error/latency within target, rollout gate decision recorded |

## Next Up

| Item | Status | Scope | Acceptance Criteria |
|---|---|---|---|
| Sandbox Promotion UX | planned | Confirmation flow for repo name/visibility/file selection | User can safely review and confirm promotion with no implicit side effects |
| Sandbox Telemetry | planned | Track creation, expiration, download, promotion start/success/abandon | Events emitted and visible in analytics/log pipeline |
| Roadmap Hygiene Automation | planned | Lightweight template/checklist for promoting `documents/` ideas into this file | New roadmap items consistently include scope + acceptance criteria |

## Decision Log

| Date | Decision | Source |
|---|---|---|
| 2026-02-09 | Root `ROADMAP.md` is canonical; `documents/` is draft space | Team decision in chat |
| 2026-02-09 | Sandbox Mode vision: real ephemeral workspace + explicit promotion paths | `documents/Sandbox mode.md` |

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
