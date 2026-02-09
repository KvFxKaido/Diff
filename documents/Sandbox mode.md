# Sandbox Mode (v1 Spec)

*Explore freely. Nothing is committed unless you choose.*

## Product Intent

Sandbox Mode is an ephemeral, consequence-light workspace for brainstorming and prototyping.
It lets users think by doing:

- talk through ideas
- create and edit files
- run commands in a real container
- shape a rough repo outline

The user can then choose what happens next:

- keep exploring
- download files
- create a new GitHub repo

Nothing is promoted automatically.

---

## Core Decisions (v1)

1. Sandbox Mode uses a real Modal container and writable filesystem.
2. Sandbox Mode is not connected to a GitHub repo by default.
3. GitHub actions are blocked until the user explicitly chooses promotion.
4. Session data is ephemeral and expires with sandbox lifecycle.
5. Promotion is always explicit and user-initiated.

---

## Entry Point

Sandbox Mode appears in the repo picker as a first-class option:

`New Sandbox`

Selecting it:

1. starts a Modal sandbox session
2. ensures an empty workspace at `/workspace`
3. opens chat with sandbox tools enabled
4. shows a clear status label:

`Sandbox — ephemeral, not connected to GitHub`

Optional seed file:

- `/workspace/scratch.txt` with neutral copy:
  - "This is an ephemeral sandbox."
  - "Create anything. Delete anything."
  - "Nothing is committed unless you choose."

---

## Allowed vs Blocked

### Allowed

- create, edit, rename, and delete files
- run code, scripts, and tests in sandbox
- ask agent to propose structure and scaffold rough files
- iterate on multiple approaches
- discard work with no side effects

### Blocked (until promotion)

- GitHub API tools
- commit and push actions
- language implying permanence by default

The assistant should behave as a collaborative thinking partner, not an auto-ship agent.

---

## Session Lifecycle

- sandbox lifetime follows existing container policy (currently 30 minutes)
- session is treated as temporary and may expire
- if expired, user can start a new sandbox
- no implicit persistence to GitHub

Optional future enhancement (not v1):

- restore last sandbox session if still alive and valid

---

## Promotion Paths

Sandbox Mode has three explicit user actions:

1. Keep Exploring
2. Download Files (.zip)
3. Create Repo from Sandbox

There is no automatic next step.

### 1) Keep Exploring

- remain in current sandbox
- no state transition

### 2) Download Files (.zip)

- user can download workspace snapshot
- no repo is created
- sandbox can continue running after download

### 3) Create Repo from Sandbox

Flow:

1. user confirms repo name
2. user confirms visibility (private/public)
3. user reviews selected files to include
4. user confirms creation
5. system creates repo and uploads selected files
6. system transitions to normal repo-locked mode

Post-create behavior:

- sandbox session is frozen for safety and clarity
- newly created repo becomes active context
- standard Push behavior resumes (tools, sandbox, coder, auditor)

---

## UX Requirements

- persistent copy in UI:
  - "Nothing is committed unless you choose."
- clear mode badge in header:
  - "Sandbox"
- promotion actions are visible but never forced
- no scary warnings, no fake urgency
- mobile-first flow with minimal steps

---

## Prompt/Agent Requirements

When in Sandbox Mode:

- assistant may use sandbox tools
- assistant must avoid GitHub actions unless user initiates promotion
- assistant should surface assumptions and tradeoffs
- assistant should prefer tentative language for structure proposals

Examples:

- good: "Here is a rough structure we can try."
- bad: "I created your repo and pushed this."

---

## Non-Goals (v1)

- automatic repo creation
- automatic commits or push
- hidden persistence semantics
- heavy templates or opinionated starters
- turning sandbox into a mandatory onboarding gate

---

## Telemetry (v1)

Track these events:

- sandbox_created
- sandbox_expired
- sandbox_download_zip
- sandbox_promotion_started
- sandbox_repo_created
- sandbox_promotion_abandoned

Purpose:

- measure where users find value
- identify friction in promotion flow
- validate sandbox-first product hypothesis

---

## Open Questions

1. Should users be able to create multiple parallel sandbox drafts?
2. Should download include ignored/temp files or only a curated set?
3. Should promotion allow selecting a subfolder rather than whole workspace?
4. Should we add optional starter templates after v1?

---

## Summary

Sandbox Mode is the place to think, test, and shape ideas with real execution but zero default commitment.
Promotion is an explicit user decision: download artifacts or create a real repo.
