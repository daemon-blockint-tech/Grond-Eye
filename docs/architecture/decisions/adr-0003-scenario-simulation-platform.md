# ADR-0003: Ops Scenario Simulation Platform

## Status

Accepted

## Date

2026-05-17

## Context

Grond `/ops` needs rehearsal-quality tracks, alerts, and tasks without live feeds. Operators and agents must share the same entity and alert surfaces as production data, with clear separation from real layers.

## Decision

1. **Server-side runner** — `src/lib/scenarios/runner.ts` owns tick loops, motion, and rule side effects. State lives in `runtime-store` (in-memory per user), not in the plugin bundle.
2. **Sim plugin as emitter** — `sim-scenarios` plugin id; `ScenarioSync` polls `GET /api/ops/scenarios/state` and publishes `dataBus.dataUpdated` so the globe and Assets rail stay agnostic.
3. **Edition gating** — `isScenariosEnabled()` allows development, `local`/`demo` editions, or `SCENARIOS_ENABLED=true` on cloud.
4. **Sim vs live** — All scenario entities set `properties.simulated: true` and `properties.caseId`. Map/list `opsSimOnly` filter hides non-sim layers when enabled.
5. **Optional disk overrides** — `local-scripts/scenarios/<caseId>/scenario.json` overrides built-in definitions via `loadScenarioFromDisk`; large cases (e.g. `multi-track-surge`) remain built-in only.

## Consequences

- No marketplace/CDN plugin required for v1; sim code ships in-app.
- Cloud deployments must opt in via `SCENARIOS_ENABLED` unless edition is demo.
- Scenario state is process-local; horizontal scale requires a shared store in a future ADR if needed.

## Related

- `src/lib/scenarios/`, `docs/agent-bus.md` (scenario_* actions)
- `local-scripts/scenarios/README.md`
