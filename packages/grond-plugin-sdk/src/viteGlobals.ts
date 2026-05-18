/**
 * @file viteGlobals.ts
 * @description Build-time utility for externalizing shared dependencies.
 * Provides a Vite plugin that maps core libraries (React, Cesium, Zustand) 
 * to the host application's global context, ensuring singleton stability 
 * for dynamic plugin bundles.
 * @module @grond/plugin-sdk
 */

interface GlobalsMap {
    [moduleId: string]: string;
}

/**
 * @function grondPluginGlobals
 * @description Creates a Vite/Rollup plugin that resolves shared dependencies to 
 * the `globalThis.__GROND_HOST__` object.
 * 
 * This ensures that dynamically loaded plugins inherit the exact library 
 * instances of the host application, preventing version mismatches and 
 * context errors.
 * 
 * @returns {any} A Vite plugin object.
 */
export function grondPluginGlobals(): any {
    const HOST_MAPPINGS: GlobalsMap = {
        "react": "React",
        "react-dom": "ReactDOM",
        "react/jsx-runtime": "jsxRuntime",
        "cesium": "Cesium",
        "resium": "Resium",
        "@grond/plugin-sdk": "GrondPluginSDK",
        "@worldwideview/wwv-plugin-sdk": "GrondPluginSDK",
        "@/core/state/store": "useStore",
        "@/core/plugins/PluginManager": "pluginManager",
        "@/components/video/CameraStream": "CameraStream"
    };

    return {
        name: "grond-plugin-globals",
        enforce: "pre",
        resolveId(id: string) {
            if (id in HOST_MAPPINGS || id === "zustand") {
                // Ensure Rollup doesn't try to look for these modules in node_modules
                return "\0" + id;
            }
            return null;
        },
        load(id: string) {
            if (!id.startsWith("\0")) return null;
            const originalId = id.slice(1);
            
            if (originalId === "react") {
                return `
                    const React = globalThis.__GROND_HOST__.React;
                    export default React;
                    export const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, useLayoutEffect, StrictMode, Suspense, createContext, createElement, cloneElement, isValidElement, Fragment, Children, Component, PureComponent, createRef, forwardRef, memo, lazy, startTransition, useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect } = React;
                `;
            }
            if (originalId === "react-dom") {
                return `
                    const ReactDOM = globalThis.__GROND_HOST__.ReactDOM;
                    export default ReactDOM;
                    export const { createPortal, flushSync } = ReactDOM;
                `;
            }
            if (originalId === "react/jsx-runtime") {
                return `
                    const jsxRuntime = globalThis.__GROND_HOST__.jsxRuntime;
                    export const jsx = jsxRuntime.jsx;
                    export const jsxs = jsxRuntime.jsxs;
                    export const Fragment = jsxRuntime.Fragment;
                `;
            }
            if (originalId === "cesium") {
                return `
                    const Cesium = globalThis.__GROND_HOST__.Cesium;
                    export default Cesium;
                    // Export common bindings for direct destructuring
                    export const { Viewer, Entity, Cartesian3, Cartesian2, Color, CallbackProperty, DistanceDisplayCondition, NearFarScalar, HeightReference, Resource, Rectangle, PolygonHierarchy, ClassificationType, ArcType, Math, JulianDate, TimeInterval, TimeIntervalCollection, SampledPositionProperty, GeoJsonDataSource, PinBuilder, CustomDataSource, ConstantProperty, ColorMaterialProperty, Cartographic } = Cesium;
                `;
            }
            if (originalId === "resium") {
                return `
                    const Resium = globalThis.__GROND_HOST__.Resium;
                    export default Resium;
                    export const { Entity, PointGraphics, BillboardGraphics, CustomDataSource, Camera, PolygonGraphics, PolylineGraphics, EllipseGraphics, LabelGraphics, ModelGraphics, PathGraphics, BoxGraphics, GeoJsonDataSource, ScreenSpaceEventHandler, ScreenSpaceEvent } = Resium;
                `;
            }
            if (originalId === "@grond/plugin-sdk" || originalId === "@worldwideview/wwv-plugin-sdk") {
                return `
                    const SDK = globalThis.__GROND_HOST__.GrondPluginSDK;
                    export default SDK;
                    export const { WorldPlugin, PluginManifest, createSvgIconUrl, DEFAULT_ICON_SIZE } = SDK;
                `;
            }
            // If zustand is required, wait, is Zustand in host globals?
            if (originalId === "zustand") {
                return `
                    if (!globalThis.__GROND_HOST__.zustand) {
                        console.warn("zustand was not found on GROND_HOST");
                    }
                    const zustand = globalThis.__GROND_HOST__.zustand || {};
                    export default zustand;
                    export const { create, createStore, useStore } = zustand;
                `;
            }
            if (originalId === "@/core/state/store") {
                return `export const useStore = globalThis.__GROND_HOST__.useStore;`;
            }
            if (originalId === "@/core/plugins/PluginManager") {
                return `export const pluginManager = globalThis.__GROND_HOST__.pluginManager;`;
            }
            if (originalId === "@/components/video/CameraStream") {
                return `export const CameraStream = globalThis.__GROND_HOST__.CameraStream;`;
            }

            return null;
        }
    };
}
