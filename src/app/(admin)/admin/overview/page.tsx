import { pluginRegistry } from "@/core/plugins/PluginRegistry";
import { getPublicEdition } from "@/core/grondEnv";

export default function AdminOverviewPage() {
    const plugins = pluginRegistry.getAll();
    const edition = getPublicEdition() ?? "local";

    return (
      <>
        <h1 className="admin-page-title">Overview</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Grond Admin — platform health and plugin summary.
        </p>
        <section style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 16,
                marginBottom: 32,
            }}
        >
          <div className="glass-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Built-in plugins</div>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{plugins.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Edition</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{edition}</div>
          </div>
        </section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Plugin registry</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {plugins.map((p) => (
            <li
              key={p.id}
              style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontSize: 13,
                    }}
            >
              <strong>{p.name}</strong>
              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{p.id}</span>
            </li>
                ))}
        </ul>
      </>
    );
}
