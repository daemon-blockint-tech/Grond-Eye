/**
 * Operations shell navigation state (left/right rails, panel visibility).
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "../store";

export type OpsLeftTab = "tracks" | "layers" | "assets" | "geo" | "recent" | "starred" | null;
export type OpsRightTab = "alerts" | "video" | "authorization" | "tasks" | "sim" | null;

export interface RecentEntityRef {
    pluginId: string;
    entityId: string;
    label?: string;
}

export interface OpsNavSlice {
    activeLeftTab: OpsLeftTab;
    leftPanelOpen: boolean;
    activeRightTab: OpsRightTab;
    rightPanelOpen: boolean;
    recentEntityIds: string[];
    recentEntities: RecentEntityRef[];
    setActiveLeftTab: (tab: OpsLeftTab) => void;
    setLeftPanelOpen: (open: boolean) => void;
    toggleLeftTab: (tab: Exclude<OpsLeftTab, null>) => void;
    setActiveRightTab: (tab: OpsRightTab) => void;
    setRightPanelOpen: (open: boolean) => void;
    toggleRightTab: (tab: Exclude<OpsRightTab, null>) => void;
    pushRecentEntity: (entityId: string) => void;
    pushRecentEntityRef: (ref: RecentEntityRef) => void;
}

export const createOpsNavSlice: StateCreator<AppStore, [], [], OpsNavSlice> = (set) => ({
    activeLeftTab: null,
    leftPanelOpen: false,
    activeRightTab: null,
    rightPanelOpen: false,
    recentEntityIds: [],
    recentEntities: [],
    setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
    setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
    toggleLeftTab: (tab) => set((state) => {
        if (state.activeLeftTab === tab && state.leftPanelOpen) {
            return { leftPanelOpen: false };
        }
        return { activeLeftTab: tab, leftPanelOpen: true };
    }),
    setActiveRightTab: (tab) => set({ activeRightTab: tab }),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    toggleRightTab: (tab) => set((state) => {
        if (state.activeRightTab === tab && state.rightPanelOpen) {
            return { rightPanelOpen: false, activeRightTab: null };
        }
        return { activeRightTab: tab, rightPanelOpen: true };
    }),
    pushRecentEntity: (entityId) => set((state) => {
        const next = [entityId, ...state.recentEntityIds.filter((id) => id !== entityId)].slice(0, 50);
        return { recentEntityIds: next };
    }),
    pushRecentEntityRef: (ref) => set((state) => {
        const key = `${ref.pluginId}:${ref.entityId}`;
        const nextIds = [key, ...state.recentEntityIds.filter((id) => id !== key)].slice(0, 50);
        const nextRefs = [
            ref,
            ...state.recentEntities.filter(
                (r) => !(r.pluginId === ref.pluginId && r.entityId === ref.entityId),
            ),
        ].slice(0, 50);
        return { recentEntityIds: nextIds, recentEntities: nextRefs };
    }),
});
