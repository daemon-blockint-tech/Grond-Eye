/**
 * Operations alerts slice — synced from /api/ops/alerts and AgentBus SSE.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "../store";

export type OpsAlertSeverity = "info" | "warn" | "critical";

export interface OpsAlert {
    id: string;
    severity: OpsAlertSeverity;
    title: string;
    body?: string | null;
    source?: string | null;
    entityPluginId?: string | null;
    entityId?: string | null;
    dismissedAt?: string | null;
    createdAt: string;
}

export interface OpsAlertsSlice {
    opsAlerts: OpsAlert[];
    opsAlertsLoading: boolean;
    setOpsAlerts: (alerts: OpsAlert[]) => void;
    upsertOpsAlert: (alert: OpsAlert) => void;
    removeOpsAlert: (id: string) => void;
    setOpsAlertsLoading: (loading: boolean) => void;
}

export const createOpsAlertsSlice: StateCreator<AppStore, [], [], OpsAlertsSlice> = (set) => ({
    opsAlerts: [],
    opsAlertsLoading: false,
    setOpsAlerts: (alerts) => set({ opsAlerts: alerts }),
    upsertOpsAlert: (alert) => set((state) => {
        if (alert.dismissedAt) {
            return { opsAlerts: state.opsAlerts.filter((a) => a.id !== alert.id) };
        }
        const idx = state.opsAlerts.findIndex((a) => a.id === alert.id);
        if (idx === -1) return { opsAlerts: [alert, ...state.opsAlerts] };
        const next = [...state.opsAlerts];
        next[idx] = alert;
        return { opsAlerts: next };
    }),
    removeOpsAlert: (id) => set((state) => ({
        opsAlerts: state.opsAlerts.filter((a) => a.id !== id),
    })),
    setOpsAlertsLoading: (loading) => set({ opsAlertsLoading: loading }),
});
