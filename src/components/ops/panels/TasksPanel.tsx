"use client";

import { useState } from "react";
import { useStore } from "@/core/state/store";
import { dataBus } from "@/core/data/DataBus";
import { pluginManager } from "@/core/plugins/PluginManager";
import { flyToEntity } from "@/core/globe/flyToEntity";
import type { OpsTask } from "@/core/state/slices/opsTasks";

/**
 * Tasks panel — list, create, and complete user tasks.
 */
export function TasksPanel() {
    const tasks = useStore((s) => s.opsTasks);
    const loading = useStore((s) => s.opsTasksLoading);
    const error = useStore((s) => s.opsTasksError);
    const upsertOpsTask = useStore((s) => s.upsertOpsTask);
    const [title, setTitle] = useState("");

    const createTask = async () => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const res = await fetch("/api/ops/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: trimmed }),
        });
        if (!res.ok) {
            alert("Could not save task. Check your connection and try again.");
            return;
        }
        const data = await res.json();
        if (data.task) upsertOpsTask(data.task);
        setTitle("");
    };

    const completeTask = async (id: string) => {
        const res = await fetch(`/api/ops/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.task) upsertOpsTask(data.task);
        }
    };

    const openOnMap = (task: OpsTask) => {
        if (task.entityPluginId && task.entityId) {
            const entities = pluginManager.getEntities(task.entityPluginId);
            const entity = entities.find((e) => e.id === task.entityId);
            if (entity) {
                useStore.getState().setSelectedEntity(entity);
                flyToEntity(entity);
                dataBus.emit("entitySelected", { entity });
                return;
            }
        }
        if (task.lat != null && task.lon != null) {
            dataBus.emit("cameraGoTo", { lat: task.lat, lon: task.lon, alt: 0, distance: 20000 });
        }
    };

    const active = tasks.filter((t) => t.status === "active");
    const done = tasks.filter((t) => t.status !== "active");

    return (
      <div className="ops-panel-body" style={{ padding: "var(--space-md)", fontSize: 13 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Tasks</h3>
        {error && <p style={{ color: "var(--accent-orange, #f59e0b)" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="New task title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1, fontSize: 12, padding: "6px 8px" }}
          />
          <button type="button" className="btn btn--glow" onClick={() => void createTask()}>
            New task
          </button>
        </div>
        {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
        {!loading && active.length === 0 && done.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No tasks. Create a task from a track detail or add one below.</p>
            )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {active.map((task) => (
            <li
              key={task.id}
              style={{ padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div style={{ fontWeight: 500 }}>{task.title}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button type="button" className="btn" style={{ fontSize: 11 }} onClick={() => void completeTask(task.id)}>
                  Mark complete
                </button>
                {(task.entityId || (task.lat != null && task.lon != null)) && (
                <button type="button" className="btn" style={{ fontSize: 11 }} onClick={() => openOnMap(task)}>
                  Open on map
                </button>
                    )}
              </div>
            </li>
                    ))}
        </ul>
        {done.length > 0 && (
        <>
          <h4 style={{ margin: "16px 0 8px", fontSize: 12, color: "var(--text-muted)" }}>Completed</h4>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, opacity: 0.7 }}>
            {done.map((task) => (
              <li key={task.id} style={{ padding: "6px 0", fontSize: 12 }}>{task.title}</li>
                        ))}
          </ul>
        </>
            )}
      </div>
    );
}
