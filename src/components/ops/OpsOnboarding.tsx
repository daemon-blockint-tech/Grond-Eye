"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/core/state/store";

const STORAGE_KEY = "grond-ops-onboarding-v1";

type CoachStep = {
    id: string;
    title: string;
    body: string;
    targetTestId?: string;
};

const STEPS: CoachStep[] = [
    {
        id: "left-rail",
        title: "Assets and layers",
        body: "Open Assets for live tracks and entities. Use Layers to turn data sources and imagery on or off.",
        targetTestId: "left-sidebar",
    },
    {
        id: "map-toolbar",
        title: "Map search",
        body: "Search places or coordinates (e.g. 37.83, -122.42). Entity name and ID search is in the Assets panel.",
        targetTestId: "cop-panel-toolbar",
    },
    {
        id: "right-rail",
        title: "Video and tasks",
        body: "Video streams, tasks, alerts, and simulation filters live on the right rail.",
        targetTestId: "right-sidebar",
    },
];

/**
 * First-visit coach marks for /ops; dismiss persists in localStorage.
 */
export function OpsOnboarding() {
    const [stepIndex, setStepIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);
    const toggleRightTab = useStore((s) => s.toggleRightTab);

    useEffect(() => {
        try {
            if (localStorage.getItem(STORAGE_KEY) === "done") return;
            setVisible(true);
        } catch {
            setVisible(false);
        }
    }, []);

    const dismiss = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, "done");
        } catch {
            /* ignore */
        }
        setVisible(false);
    }, []);

    const replay = useCallback(() => {
        setStepIndex(0);
        setVisible(true);
    }, []);

    useEffect(() => {
        const handler = () => replay();
        window.addEventListener("grond-ops-onboarding-replay", handler);
        return () => window.removeEventListener("grond-ops-onboarding-replay", handler);
    }, [replay]);

    if (!visible) return null;

    const step = STEPS[stepIndex];
    const isLast = stepIndex >= STEPS.length - 1;

    return (
      <div
        className="ops-onboarding-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-onboarding-title"
        style={{
                position: "fixed",
                inset: 0,
                zIndex: 9000,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: 24,
            }}
      >
        <div
          className="glass-panel"
          style={{
                    maxWidth: 420,
                    width: "100%",
                    padding: "var(--space-lg)",
                    border: "1px solid var(--border-subtle)",
                }}
        >
          <h2 id="ops-onboarding-title" style={{ margin: "0 0 8px", fontSize: 16 }}>
            {step.title}
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-muted)" }}>{step.body}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn" onClick={dismiss}>
              Skip tour
            </button>
            {!isLast ? (
              <button
                type="button"
                className="btn btn--glow"
                onClick={() => {
                            if (step.id === "left-rail") toggleLeftTab("tracks");
                            if (step.id === "right-rail") toggleRightTab("video");
                            setStepIndex((i) => i + 1);
                        }}
              >
                Next
              </button>
            ) : (
              <button type="button" className="btn btn--glow" onClick={dismiss}>
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    );
}

/** Replay onboarding from Help menu. */
export function replayOpsOnboarding(): void {
    window.dispatchEvent(new Event("grond-ops-onboarding-replay"));
}
