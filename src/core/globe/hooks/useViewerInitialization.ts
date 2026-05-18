import { useCallback, useRef, useState } from "react";
import type { Viewer as CesiumViewer } from "cesium";
import {
    Cartesian3,
    CameraEventType,
    KeyboardEventModifier,
} from "cesium";
import { dataBus } from "@/core/data/DataBus";
import { useStore } from "@/core/state/store";
import { initPrimitiveCollections } from "../EntityRenderer";
import {
    hasGoogleMapsApiKey,
    loadGooglePhotorealistic3DTileset,
    resolveGoogle3dRasterFallback,
} from "../googlePhotorealistic3d";

export function useViewerInitialization(sceneSettings: {
    showFps: boolean;
    resolutionScale: number;
    antiAliasing: string;
    maxScreenSpaceError: number;
}) {
    const viewerRef = useRef<CesiumViewer | null>(null);
    const [viewerReady, setViewerReady] = useState(false);

    const handleViewerReady = useCallback(async (viewer: CesiumViewer) => {
        viewerRef.current = viewer;

        viewer.imageryLayers.removeAll();
        viewer.scene.requestRenderMode = true;
        viewer.scene.maximumRenderTimeChange = 0.5;
        viewer.scene.debugShowFramesPerSecond = sceneSettings.showFps;
        viewer.resolutionScale = sceneSettings.resolutionScale;
        viewer.scene.postProcessStages.fxaa.enabled = sceneSettings.antiAliasing === "fxaa";
        viewer.scene.msaaSamples = sceneSettings.antiAliasing === "none" || sceneSettings.antiAliasing === "fxaa"
            ? 1
            : parseInt(sceneSettings.antiAliasing.replace("msaa", "").replace("x", ""), 10) || 1;
        viewer.scene.globe.depthTestAgainstTerrain = true;

        const sscc = viewer.scene.screenSpaceCameraController;
        sscc.tiltEventTypes = [
            CameraEventType.MIDDLE_DRAG,
            CameraEventType.RIGHT_DRAG,
            CameraEventType.PINCH,
            { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
            { eventType: CameraEventType.RIGHT_DRAG, modifier: KeyboardEventModifier.CTRL },
        ];
        sscc.zoomEventTypes = [CameraEventType.WHEEL, CameraEventType.PINCH];

        if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
            (sscc as { _zoomFactor?: number })._zoomFactor = 5;
            (sscc as { _translateFactor?: number })._translateFactor = 2;
            (sscc as { _tiltFactor?: number })._tiltFactor = 50;
        }

        initPrimitiveCollections(viewer);

        viewer.scene.renderError.addEventListener((_scene, error) => {
            console.error("[Cesium Render Error] Render loop crashed! Exception:");
            console.error(error);
        });

        viewer.camera.setView({ destination: Cartesian3.fromDegrees(0, 20, 10000000) });
        setViewerReady(true);

        let globeFired = false;
        const fireGlobeReady = () => {
            if (globeFired) return;
            globeFired = true;
            if (!viewer.isDestroyed()) {
                viewer.camera.setView({ destination: Cartesian3.fromDegrees(0, 20, 60000000) });
            }
            dataBus.emit("globeReady", {} as Record<string, never>);
        };

        const globalTimeout = setTimeout(() => {
            console.warn("[GlobeView] Global tile-init timeout (15s) — forcing globe ready.");
            fireGlobeReady();
        }, 15_000);

        try {
            let googleLoaded = false;

            if (hasGoogleMapsApiKey()) {
                try {
                    const tileset = await loadGooglePhotorealistic3DTileset(
                        viewer,
                        sceneSettings.maxScreenSpaceError,
                    );

                    if (viewer.isDestroyed()) {
                        clearTimeout(globalTimeout);
                        return;
                    }

                    if (tileset) {
                        const removeListener = tileset.initialTilesLoaded.addEventListener(() => {
                            console.log("[GlobeView] Initial Google 3D tiles loaded — syncing state.");
                            useStore.getState().updateMapConfig({ baseLayerId: "google-3d" });
                            clearTimeout(globalTimeout);
                            fireGlobeReady();
                            removeListener();
                        });
                        googleLoaded = true;
                    }
                } catch (err) {
                    console.error("[GlobeView] Failed to initialize Google 3D Tiles:", err);
                }
            }

            if (!googleLoaded) {
                const { mapConfig, updateMapConfig } = useStore.getState();
                if (mapConfig.baseLayerId === "google-3d") {
                    const fallbackLayerId = await resolveGoogle3dRasterFallback();
                    updateMapConfig({ fallbackLayerId });
                }
                clearTimeout(globalTimeout);
                fireGlobeReady();
            }
        } catch (err) {
            console.error("[GlobeView] Unexpected error during early globe init:", err);
            clearTimeout(globalTimeout);
            fireGlobeReady();
        }
    }, [sceneSettings]);

    return { viewerRef, viewerReady, handleViewerReady };
}
