# ADR-0002: Grond rebrand and marketplace JWT cutover

## Status

Accepted (2026-05)

## Context

The product was renamed from WorldWideView (WWV) to **Grond**. The operations UI moved to `/ops` with Lattice-style layout. Marketplace integration must use a single JWT issuer/audience pair to avoid split-brain auth.

## Decision

1. User-facing name: **Grond** everywhere in app shells.
2. Env vars: `NEXT_PUBLIC_GROND_*` / `GROND_*` with one-release read fallback from `WWV_*` via `src/core/grondEnv.ts`.
3. Marketplace JWT: **`iss: grond`**, **`aud: grond-marketplace`** only — no dual-read.
4. Plugin `package.json` block: prefer **`"grond"`**; build tooling may read legacy `"worldwideview"` until plugins are migrated.
5. npm scope: `@grond/plugin-sdk` (package directory may remain `packages/wwv-plugin-sdk` until a follow-up rename).

## Consequences

- Marketplace backend must deploy in sync with app releases that change JWT or manifest validation.
- Deploy runbooks: `local-scripts/marketplace-grond-cutover.md`, `local-scripts/deploy-smoke-grond.md`.
