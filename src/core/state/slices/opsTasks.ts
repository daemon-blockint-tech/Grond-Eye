/**
 * Operations tasks slice — synced from /api/ops/tasks and AgentBus SSE.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "../store";

export type OpsTaskStatus = "active" | "completed" | "cancelled";

export interface OpsTask {
    id: string;
    title: string;
    status: OpsTaskStatus;
    entityPluginId?: string | null;
    entityId?: string | null;
    lat?: number | null;
    lon?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface OpsTasksSlice {
    opsTasks: OpsTask[];
    opsTasksLoading: boolean;
    opsTasksError: string | null;
    setOpsTasks: (tasks: OpsTask[]) => void;
    upsertOpsTask: (task: OpsTask) => void;
    setOpsTasksLoading: (loading: boolean) => void;
    setOpsTasksError: (error: string | null) => void;
}

export const createOpsTasksSlice: StateCreator<AppStore, [], [], OpsTasksSlice> = (set) => ({
    opsTasks: [],
    opsTasksLoading: false,
    opsTasksError: null,
    setOpsTasks: (tasks) => set({ opsTasks: tasks }),
    upsertOpsTask: (task) => set((state) => {
        const idx = state.opsTasks.findIndex((t) => t.id === task.id);
        if (idx === -1) return { opsTasks: [task, ...state.opsTasks] };
        const next = [...state.opsTasks];
        next[idx] = task;
        return { opsTasks: next };
    }),
    setOpsTasksLoading: (loading) => set({ opsTasksLoading: loading }),
    setOpsTasksError: (error) => set({ opsTasksError: error }),
});
