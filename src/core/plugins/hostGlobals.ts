/**
 * @file hostGlobals.ts
 * @description Exposes essential host libraries (React, Cesium, SDK, etc.) on `globalThis`.
 * This allows dynamically loaded ES module plugins to share the host's dependencies
 * rather than bundling their own copies, preventing version conflicts and reducing bundle size.
 */

import React from "react";
import * as ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
import * as GrondPluginSDK from "@grond/plugin-sdk";
import { getPluginDataEngineUrl } from "@/core/grondEnv";
import * as Cesium from "cesium";
import * as Resium from "resium";
import * as zustand from "zustand";
import { useStore } from "@/core/state/store";
import { pluginManager } from "@/core/plugins/PluginManager";
import { CameraStream } from "@/components/video/CameraStream";

export interface GrondHostGlobals {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
    jsxRuntime: typeof jsxRuntime;
    WWVPluginSDK: typeof GrondPluginSDK;
    GrondPluginSDK: typeof GrondPluginSDK;
    Cesium: typeof Cesium;
    Resium: typeof Resium;
    zustand: typeof zustand;
    useStore: typeof useStore;
    pluginManager: typeof pluginManager;
    CameraStream: typeof CameraStream;
}

declare global {

    var __WWV_HOST__: GrondHostGlobals | undefined;
    var __GROND_HOST__: GrondHostGlobals | undefined;
}

/**
 * Injects the required libraries and configuration onto the global scope.
 *
 * This must be called exactly once during the application's initial boot sequence,
 * before any dynamic plugins are imported.
 *
 * @returns A promise that resolves when all globals have been injected.
 */
export async function injectHostGlobals(): Promise<void> {
    if (globalThis.__WWV_HOST__ || globalThis.__GROND_HOST__) return;

    const Cesium = await import("cesium");
    const Resium = await import("resium");

    const host: GrondHostGlobals = {
        React,
        ReactDOM,
        jsxRuntime,
        WWVPluginSDK: GrondPluginSDK,
        GrondPluginSDK,
        Cesium,
        Resium,
        zustand,
        useStore,
        pluginManager,
        CameraStream,
    };
    globalThis.__WWV_HOST__ = host;
    globalThis.__GROND_HOST__ = host;

    const envDataEngine = getPluginDataEngineUrl();
    const engineHttp = envDataEngine ?? "https://dataengine.grond.dev";
    const engineWs = envDataEngine
        ? `${envDataEngine.replace(/^http/, "ws")}/stream`
        : "wss://dataengine.grond.dev/stream";
    (globalThis as unknown as { __WWV_ENGINE_URL__?: string }).__WWV_ENGINE_URL__ = engineHttp;
    (globalThis as unknown as { __GROND_ENGINE_URL__?: string }).__GROND_ENGINE_URL__ = engineHttp;
    (globalThis as unknown as { __WWV_WS_ENGINE_URL__?: string }).__WWV_WS_ENGINE_URL__ = engineWs;
    (globalThis as unknown as { __GROND_WS_ENGINE_URL__?: string }).__GROND_WS_ENGINE_URL__ = engineWs;

    console.log("[HostGlobals] React and SDK injected for dynamic plugins");
}
