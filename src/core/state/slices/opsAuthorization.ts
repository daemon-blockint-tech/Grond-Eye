/**
 * Read-only authorization snapshot for the ops right rail.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "../store";

export interface OpsAuthorizationEntry {
    pluginId: string;
    name: string;
    enabled: boolean;
    capabilities: string[];
}

export interface OpsAuthorizationSnapshot {
    role: string;
    plugins: OpsAuthorizationEntry[];
}

export interface OpsAuthorizationSlice {
    opsAuthorization: OpsAuthorizationSnapshot | null;
    setOpsAuthorization: (snapshot: OpsAuthorizationSnapshot | null) => void;
}

export const createOpsAuthorizationSlice: StateCreator<AppStore, [], [], OpsAuthorizationSlice> = (set) => ({
    opsAuthorization: null,
    setOpsAuthorization: (snapshot) => set({ opsAuthorization: snapshot }),
});
