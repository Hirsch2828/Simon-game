# Milestones — Build Plan

> The main development milestones of the project, in build order, based on PRD.md, ARCHITECTURE.md, and DESIGN.md.
>
> Prefer **vertical slices**: each milestone delivers a complete, end-to-end user capability rather than a separate technical layer (UI, backend, database). A purely technical milestone is justified only for initial project setup or as a significant prerequisite. Keep a reasonable number of meaningful milestones — not one per small task — and do not add features that are not defined in the project documents.
>
> If ARCHITECTURE.md defines separate Development and Production environments (e.g. two Supabase projects): include the setup of both environments in the first milestone that uses the database, as an action the user performs with guidance. A milestone that changes the database schema is built and tested against Development only; updating Production belongs to deployment.

## Development Execution Rules
- Develop the milestones in the order defined in this document.
- After completing each milestone, stop development and present to the user the completed deliverable and the test results against its Definition of Done.
- The user checks the deliverable themselves and asks for fixes where needed.
- Do not begin developing the next milestone without the user's approval — a request to push the changes to GitHub, or an explicit approval.

> Progress marks next to a milestone title (Claude adds them; the rules are in CLAUDE.md): 🟡 = built, waiting for approval · ✅ = approved.

---

## Milestone 1 — <name, e.g. Project setup: the app runs end-to-end with one simple screen>
- **Purpose:** <the objective of the milestone and what it is intended to achieve>
- **Implementation scope:** <the main features and components to develop>
- **Expected deliverable:** <what should be functional and available when the milestone is complete>
- **Definition of Done:**
  - <a clear, verifiable criterion>
  - <a clear, verifiable criterion>

## Milestone 2 — <name>
- **Purpose:** <...>
- **Implementation scope:** <...>
- **Expected deliverable:** <...>
- **Definition of Done:**
  - <...>

> Add as many milestones as the app needs, in the same format (Milestone 3, Milestone 4, ...).
