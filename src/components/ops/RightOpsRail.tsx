"use client";

import {
    AlertTriangle, Video, Shield, ListTodo, Cpu
} from "lucide-react";
import { useStore } from "@/core/state/store";
import type { OpsRightTab } from "@/core/state/slices/opsNav";
import { AlertsPanel } from "./panels/AlertsPanel";
import { TasksPanel } from "./panels/TasksPanel";
import { AuthorizationPanel } from "./panels/AuthorizationPanel";
import { SimPanel } from "./panels/SimPanel";
import { VideoPanel } from "./panels/VideoPanel";

const TABS: { id: Exclude<OpsRightTab, null>; label: string; icon: typeof Video }[] = [
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "video", label: "Video", icon: Video },
    { id: "authorization", label: "Authorization", icon: Shield },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "sim", label: "Sim", icon: Cpu },
];

function RightPanelBody({ tab }: { tab: OpsRightTab }) {
    if (tab === "alerts") return <AlertsPanel />;
    if (tab === "tasks") return <TasksPanel />;
    if (tab === "authorization") return <AuthorizationPanel />;
    if (tab === "sim") return <SimPanel />;
    if (tab === "video") return <VideoPanel />;
    return null;
}

/**
 * Right icon rail and optional detail panel.
 */
export function RightOpsRail() {
    const activeRightTab = useStore((s) => s.activeRightTab);
    const rightPanelOpen = useStore((s) => s.rightPanelOpen);
    const toggleRightTab = useStore((s) => s.toggleRightTab);
    const alertCount = useStore((s) => s.opsAlerts.length);

    return (
      <>
        <nav className="ops-right-rail" data-testid="right-sidebar" aria-label="Operations tools">
          {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = rightPanelOpen && activeRightTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`ops-rail__btn ops-left-rail__btn ${active ? "ops-rail__btn--active ops-left-rail__btn--active" : ""}`}
                        title={tab.label}
                        aria-label={tab.label}
                        aria-pressed={active}
                        onClick={() => toggleRightTab(tab.id)}
                        style={{ position: "relative" }}
                      >
                        <Icon size={16} />
                        {tab.id === "alerts" && alertCount > 0 && (
                        <span
                          style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        minWidth: 14,
                                        height: 14,
                                        borderRadius: 7,
                                        background: "var(--accent-orange, #f59e0b)",
                                        color: "#000",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "0 3px",
                                    }}
                        >
                          {alertCount > 9 ? "9+" : alertCount}
                        </span>
                            )}
                      </button>
                    );
                })}
        </nav>
        <aside
          className={`ops-right-panel glass-panel ${rightPanelOpen && activeRightTab ? "" : "ops-right-panel--closed"}`}
          data-testid="right-panel-manager"
          aria-expanded={rightPanelOpen && !!activeRightTab}
        >
          {rightPanelOpen && activeRightTab && <RightPanelBody tab={activeRightTab} />}
        </aside>
      </>
    );
}
