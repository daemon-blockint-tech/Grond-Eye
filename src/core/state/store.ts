/**
 * @file store.ts
 * @description The central state management hub for Grond.
 * Combines multiple Zustand slices into a single unified store for the entire application.
 */

import { create } from "zustand";
import { createGlobeSlice, type GlobeSlice } from "./globeSlice";
import { createLayersSlice, type LayersSlice } from "./layersSlice";
import { createTimelineSlice, type TimelineSlice } from "./timelineSlice";
import { createUISlice, type UISlice } from "./uiSlice";
import { createFilterSlice, type FilterSlice } from "./filterSlice";
import { createDataSlice, type DataSlice } from "./dataSlice";
import { createConfigSlice, type ConfigSlice } from "./configSlice";
import { createFavoritesSlice, type FavoritesSlice } from "./favoritesSlice";
import { createOpsNavSlice, type OpsNavSlice } from "./slices/opsNav";
import { createOpsTasksSlice, type OpsTasksSlice } from "./slices/opsTasks";
import { createOpsAlertsSlice, type OpsAlertsSlice } from "./slices/opsAlerts";
import { createOpsSimSlice, type OpsSimSlice } from "./slices/opsSim";
import { createOpsAuthorizationSlice, type OpsAuthorizationSlice } from "./slices/opsAuthorization";

/**
 * Re-exporting slice types for easier access from components and utilities.
 */
export type { MapConfig, DataConfig } from "./configSlice";
export type { LayerState } from "./layersSlice";

// ─── Combined Store ──────────────────────────────────────────
export type AppStore = GlobeSlice &
    LayersSlice &
    TimelineSlice &
    UISlice &
    FilterSlice &
    DataSlice &
    ConfigSlice &
    FavoritesSlice &
    OpsNavSlice &
    OpsTasksSlice &
    OpsAlertsSlice &
    OpsSimSlice &
    OpsAuthorizationSlice;

/**
 * The primary hook for accessing and modifying the application state.
 */
export const useStore = create<AppStore>((...args) => ({
    ...createGlobeSlice(...args),
    ...createLayersSlice(...args),
    ...createTimelineSlice(...args),
    ...createUISlice(...args),
    ...createFilterSlice(...args),
    ...createDataSlice(...args),
    ...createConfigSlice(...args),
    ...createFavoritesSlice(...args),
    ...createOpsNavSlice(...args),
    ...createOpsTasksSlice(...args),
    ...createOpsAlertsSlice(...args),
    ...createOpsSimSlice(...args),
    ...createOpsAuthorizationSlice(...args),
}));
