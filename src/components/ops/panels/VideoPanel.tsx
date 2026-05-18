"use client";

import { useStore } from "@/core/state/store";

/**
 * Video panel — lists floating stream windows and offers focus controls.
 */
export function VideoPanel() {
    const floatingStreams = useStore((s) => s.floatingStreams);
    const updateFloatingStream = useStore((s) => s.updateFloatingStream);
    const removeFloatingStream = useStore((s) => s.removeFloatingStream);

    if (floatingStreams.length === 0) {
        return (
          <div className="ops-panel-body" style={{ padding: "var(--space-md)", fontSize: 13 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Video</h3>
            <p style={{ color: "var(--text-muted)" }}>
              No video feeds open. Open a camera from the map or Assets panel.
            </p>
          </div>
        );
    }

    return (
      <div className="ops-panel-body" style={{ padding: "var(--space-md)", fontSize: 13 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Video</h3>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {floatingStreams.map((stream) => (
            <li
              key={stream.id}
              style={{
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                    }}
            >
              <div style={{ fontWeight: 500 }}>{stream.id}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn--glow"
                  style={{ fontSize: 11 }}
                  onClick={() => updateFloatingStream(stream.id, { isMinimized: false })}
                >
                  Focus
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 11 }}
                  onClick={() => removeFloatingStream(stream.id)}
                >
                  Close
                </button>
              </div>
            </li>
                    ))}
        </ul>
      </div>
    );
}
