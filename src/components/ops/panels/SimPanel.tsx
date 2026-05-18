"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/core/state/store";
import type { ScenarioRunStatus } from "@/lib/scenarios/types";

type ScenarioMeta = { id: string; title: string; description?: string };

/**
 * Simulation controls: sim-only filter, scenario case picker, run/stop.
 */
export function SimPanel() {
    const simOnly = useStore((s) => s.opsSimOnly);
    const setOpsSimOnly = useStore((s) => s.setOpsSimOnly);

    const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
    const [caseId, setCaseId] = useState("");
    const [status, setStatus] = useState<ScenarioRunStatus | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCatalog = useCallback(async () => {
        const res = await fetch("/api/ops/scenarios");
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.scenarios) ? data.scenarios : [];
        setScenarios(list);
        setCaseId((prev) => prev || (list[0]?.id ?? ""));
    }, []);

    const refreshStatus = useCallback(async () => {
        const res = await fetch("/api/ops/scenarios/state", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus({
            active: data.active === true,
            caseId: data.caseId ?? null,
            tick: typeof data.tick === "number" ? data.tick : 0,
            entityCount: typeof data.entityCount === "number" ? data.entityCount : 0,
            startedAt: data.startedAt ?? null,
        });
    }, []);

    useEffect(() => {
        void loadCatalog();
        void refreshStatus();
        const id = setInterval(() => void refreshStatus(), 2000);
        return () => clearInterval(id);
    }, [loadCatalog, refreshStatus]);

    const toggleSimOnly = async () => {
        const next = !simOnly;
        const res = await fetch("/api/ops/sim", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: next }),
        });
        if (res.ok) {
            const data = await res.json();
            setOpsSimOnly(data.enabled === true);
        }
    };

    const runScenario = async () => {
        if (!caseId) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/ops/scenarios/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caseId }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Failed to start scenario");
                return;
            }
            setStatus(data.status ?? null);
        } finally {
            setBusy(false);
        }
    };

    const stopScenarioRun = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/ops/scenarios/stop", { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Failed to stop scenario");
                return;
            }
            await refreshStatus();
        } finally {
            setBusy(false);
        }
    };

    return (
      <div className="ops-panel-body ops-sim-panel">
        <h3 className="ops-sim-panel__title">Simulation</h3>

        <section className="ops-sim-panel__section">
          <p className="ops-sim-panel__hint">
            Filter the map and Assets list to simulated entities only.
          </p>
          <label className="ops-sim-panel__checkbox">
            <input type="checkbox" checked={simOnly} onChange={() => void toggleSimOnly()} />
            <span>Show simulated tracks only</span>
          </label>
        </section>

        <section className="ops-sim-panel__section">
          <h4 className="ops-sim-panel__subtitle">Scenario cases</h4>
          <label className="ops-sim-panel__field">
            <span>Case</span>
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              disabled={busy || status?.active === true}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          {scenarios.find((s) => s.id === caseId)?.description ? (
            <p className="ops-sim-panel__hint">
              {scenarios.find((s) => s.id === caseId)?.description}
            </p>
          ) : null}
          <div className="ops-sim-panel__actions">
            <button
              type="button"
              className="ops-sim-panel__btn ops-sim-panel__btn--primary"
              disabled={busy || !caseId || status?.active === true}
              onClick={() => void runScenario()}
            >
              Run
            </button>
            <button
              type="button"
              className="ops-sim-panel__btn"
              disabled={busy || status?.active !== true}
              onClick={() => void stopScenarioRun()}
            >
              Stop
            </button>
          </div>
          {error ? <p className="ops-sim-panel__error">{error}</p> : null}
          {status?.active ? (
            <p className="ops-sim-panel__status">
              Running <strong>{status.caseId}</strong> — tick {status.tick},{" "}
              {status.entityCount} entities
            </p>
          ) : (
            <p className="ops-sim-panel__status ops-sim-panel__status--idle">No scenario running</p>
          )}
        </section>
      </div>
    );
}
