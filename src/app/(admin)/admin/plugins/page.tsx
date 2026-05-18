"use client";

import { PluginsTab } from "@/components/panels/PluginsTab";

export default function AdminPluginsPage() {
    return (
      <>
        <h1 className="admin-page-title">Plugins & marketplace</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
          Install, update, and manage data plugins for Grond Operations.
        </p>
        <div className="glass-panel" style={{ padding: 0, overflow: "hidden", minHeight: 400 }}>
          <PluginsTab />
        </div>
      </>
    );
}
