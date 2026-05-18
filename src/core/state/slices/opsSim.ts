/**
 * Simulation-only filter for tracks list and map visibility.
 */

import type { StateCreator } from "zustand";
import type { AppStore } from "../store";

export interface OpsSimSlice {
    opsSimOnly: boolean;
    setOpsSimOnly: (enabled: boolean) => void;
}

export const createOpsSimSlice: StateCreator<AppStore, [], [], OpsSimSlice> = (set) => ({
    opsSimOnly: false,
    setOpsSimOnly: (enabled) => set({ opsSimOnly: enabled }),
});
