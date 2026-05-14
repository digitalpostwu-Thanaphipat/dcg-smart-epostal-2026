# ADR-005: Deployment Automation & Configuration Decoupling

## Status
Accepted

## Context
The project required manual copy-pasting of the Google Apps Script `Deployment ID` into `vite.config.ts` every time a new version was deployed. This was error-prone, caused build failures when forgotten, and created unnecessary noise in version control.

## Decision
We have implemented an automated deployment sync system that decouples the Deployment ID from the codebase:

1.  **Environment Variables**: `vite.config.ts` now uses `loadEnv` to read `VITE_GAS_DEPLOY_ID` from the environment.
2.  **Sync Script**: A new Node.js script (`.agents/scripts/sync-deploy.js`) handles the build, push, and deployment process. It automatically extracts the new ID and writes it to `frontend/.env.local`.
3.  **Fallback Mechanism**: `vite.config.ts` includes a fallback ID to ensure the dev server starts even if `.env.local` is missing.

## Alternatives Considered
- **Direct config modification**: Rejected due to high risk of syntax corruption.
- **Manual update**: Rejected due to poor developer experience and high risk of error.

## Consequences
- **Positive**: 100% automated deployment flow, reduced human error, clean Git history.
- **Negative**: Adds a dependency on a Node.js sync script; developers must run `npm run deploy:sync` instead of manual `clasp` commands for the full effect.
