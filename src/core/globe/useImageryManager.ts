import { useEffect, useRef } from "react";
import {
    Viewer as CesiumViewer,
    ImageryLayer,
    SceneMode,
    Cesium3DTileset,
    Cesium3DTileStyle,
    createOsmBuildingsAsync,
} from "cesium";
import { useStore } from "@/core/state/store";
import {
    createImageryProvider,
    createOsmProvider,
    isGeeImageryLayerId,
} from "./ImageryProviderFactory";
import {
    ensureGooglePhotorealistic3DTileset,
    findGooglePhotorealisticTileset,
    hasGoogleMapsApiKey,
    resolveGoogle3dRasterFallback,
} from "./googlePhotorealistic3d";

export function useImageryManager(viewer: CesiumViewer | null, viewerReady: boolean) {
    const baseLayerId = useStore((s) => s.mapConfig.baseLayerId);
    const fallbackLayerId = useStore((s) => s.mapConfig.fallbackLayerId);
    const sceneMode = useStore((s) => s.mapConfig.sceneMode);
    const showOsmBuildings = useStore((s) => s.mapConfig.showOsmBuildings);
    const maxScreenSpaceError = useStore((s) => s.mapConfig.maxScreenSpaceError);

    const activeLayerId = fallbackLayerId || baseLayerId;

    const currentImageryLayerRef = useRef<ImageryLayer | null>(null);
    const osmBuildingsRef = useRef<Cesium3DTileset | null>(null);
    const googleLoadAttemptRef = useRef(false);

    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        let targetMode = SceneMode.SCENE3D;
        if (sceneMode === 1) targetMode = SceneMode.COLUMBUS_VIEW;
        if (sceneMode === 2) targetMode = SceneMode.SCENE2D;

        if (viewer.scene.mode !== targetMode) {
            if (targetMode === SceneMode.SCENE2D) viewer.scene.morphTo2D(1.0);
            else if (targetMode === SceneMode.SCENE3D) viewer.scene.morphTo3D(1.0);
            else if (targetMode === SceneMode.COLUMBUS_VIEW) viewer.scene.morphToColumbusView(1.0);
        }
    }, [viewer, viewerReady, sceneMode]);

    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        let cancelled = false;

        async function updateImagery() {
            if (!viewer || !viewerReady || viewer.isDestroyed() || cancelled) return;

            const wantsGoogle3D = baseLayerId === "google-3d";
            const isGoogle3D = activeLayerId === "google-3d";

            let googleTileset = findGooglePhotorealisticTileset(viewer);

            if (wantsGoogle3D && !googleTileset && !googleLoadAttemptRef.current) {
                if (!hasGoogleMapsApiKey()) {
                    const rasterFallback = await resolveGoogle3dRasterFallback();
                    const { updateMapConfig } = useStore.getState();
                    updateMapConfig({ fallbackLayerId: rasterFallback });
                    return;
                }

                googleLoadAttemptRef.current = true;
                try {
                    googleTileset = await ensureGooglePhotorealistic3DTileset(
                        viewer,
                        maxScreenSpaceError,
                    );
                } finally {
                    googleLoadAttemptRef.current = false;
                }

                if (cancelled || !viewer || viewer.isDestroyed()) return;

                if (!googleTileset) {
                    const rasterFallback = await resolveGoogle3dRasterFallback();
                    useStore.getState().updateMapConfig({ fallbackLayerId: rasterFallback });
                    return;
                }
            }

            googleTileset = findGooglePhotorealisticTileset(viewer);
            const google3dActive = isGoogle3D && googleTileset !== null;

            if (googleTileset) {
                googleTileset.show = isGoogle3D;
            }

            // Only hide the globe ellipsoid when Google 3D tiles are actually present.
            viewer.scene.globe.show = !google3dActive;

            if (isGoogle3D) {
                if (google3dActive) {
                    if (currentImageryLayerRef.current) {
                        viewer.imageryLayers.remove(currentImageryLayerRef.current);
                        currentImageryLayerRef.current = null;
                    }
                    return;
                }

                // Google 3D selected but tiles not ready — keep a raster underlay visible.
                try {
                    const underlayId = fallbackLayerId ?? "osm";
                    const provider = underlayId === "osm"
                        ? createOsmProvider()
                        : await createImageryProvider(underlayId);
                    const underlayLayer = new ImageryLayer(provider);

                    if (currentImageryLayerRef.current) {
                        viewer.imageryLayers.remove(currentImageryLayerRef.current);
                    }
                    if (viewer.isDestroyed() || cancelled) return;
                    viewer.imageryLayers.add(underlayLayer, 0);
                    currentImageryLayerRef.current = underlayLayer;
                } catch (err) {
                    console.warn("[useImageryManager] Google 3D underlay failed:", err);
                }
                return;
            }

            try {
                const provider = await createImageryProvider(activeLayerId);
                const newLayer = new ImageryLayer(provider);

                if (currentImageryLayerRef.current) {
                    viewer.imageryLayers.remove(currentImageryLayerRef.current);
                }

                if (viewer.isDestroyed() || cancelled) return;
                viewer.imageryLayers.add(newLayer, 0);
                currentImageryLayerRef.current = newLayer;
            } catch (err) {
                const geeLayer = isGeeImageryLayerId(activeLayerId);
                if (geeLayer) {
                    console.warn(
                        "[useImageryManager] Earth Engine imagery unavailable, using OSM:",
                        activeLayerId,
                        err,
                    );
                    const { mapConfig, updateMapConfig } = useStore.getState();
                    if (isGeeImageryLayerId(mapConfig.baseLayerId)) {
                        updateMapConfig({ baseLayerId: "osm", fallbackLayerId: null });
                    } else if (mapConfig.fallbackLayerId) {
                        updateMapConfig({ fallbackLayerId: null });
                    }
                } else {
                    console.error(
                        "[useImageryManager] Failed to load imagery:",
                        activeLayerId,
                        err,
                    );
                }
                try {
                    const osmProvider = createOsmProvider();
                    const osmLayer = new ImageryLayer(osmProvider);
                    if (viewer.isDestroyed() || cancelled) return;
                    viewer.imageryLayers.add(osmLayer, 0);
                    currentImageryLayerRef.current = osmLayer;
                } catch (fallbackErr) {
                    console.error("[useImageryManager] OSM fallback also failed:", fallbackErr);
                }
            }
        }

        updateImagery();

        return () => {
            cancelled = true;
        };
    }, [viewer, viewerReady, baseLayerId, fallbackLayerId, activeLayerId, maxScreenSpaceError]);

    const isGoogle3D = activeLayerId === "google-3d";
    const is3DMode = sceneMode === 3;

    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        const shouldShow = showOsmBuildings && !isGoogle3D && is3DMode;

        if (shouldShow && !osmBuildingsRef.current) {
            let cancelled = false;
            createOsmBuildingsAsync().then((tileset) => {
                if (cancelled || !viewer || viewer.isDestroyed()) {
                    tileset.destroy();
                    return;
                }
                (tileset as Cesium3DTileset & { _grondOsmBuildings?: boolean })._grondOsmBuildings = true;
                tileset.maximumScreenSpaceError = 16;
                tileset.style = new Cesium3DTileStyle({
                    color: "color('#E0DDD5')",
                });
                viewer.scene.primitives.add(tileset);
                osmBuildingsRef.current = tileset;
            }).catch((err) => {
                console.warn("[useImageryManager] Failed to load OSM 3D Buildings:", err);
            });
            return () => { cancelled = true; };
        }

        if (!shouldShow && osmBuildingsRef.current) {
            if (!viewer.isDestroyed()) {
                viewer.scene.primitives.remove(osmBuildingsRef.current);
            }
            osmBuildingsRef.current = null;
        }
    }, [viewer, viewerReady, isGoogle3D, is3DMode, showOsmBuildings]);

    return {
        isGoogle3D,
    };
}
