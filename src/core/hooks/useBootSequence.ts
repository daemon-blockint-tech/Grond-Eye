"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dataBus } from "@/core/data/DataBus";

export type BootPhase = "loading" | "booting" | "ready";

export interface BootState {
    phase: BootPhase;
    headerReady: boolean;
    sidebarReady: boolean;
    timelineReady: boolean;
    controlsReady: boolean;
}

// Now event-driven (triggered after tiles load), so delays are short.
// Camera fly-in starts immediately; overlay fades at 500ms.
const DELAY = {
    flyIn: 0,
    overlayFade: 500,
    header: 1200,
    sidebar: 1800,
    timeline: 2400,
    controls: 2700,
    done: 3500,
} as const;

const initialState: BootState = {
    phase: "loading",
    headerReady: false,
    sidebarReady: false,
    timelineReady: false,
    controlsReady: false,
};

/** Module singleton so PlatformBootstrap and OpsShell share one boot sequence. */
let bootState: BootState = { ...initialState };
const listeners = new Set<() => void>();
let timers: ReturnType<typeof setTimeout>[] = [];
let bootStarted = false;

function notifyBootListeners(): void {
    listeners.forEach((listener) => listener());
}

function patchBootState(patch: Partial<BootState>): void {
    bootState = { ...bootState, ...patch };
    notifyBootListeners();
}

function runStartBoot(): void {
    if (bootStarted) return;
    bootStarted = true;

    timers = [
        setTimeout(() => {
            dataBus.emit("cameraPreset", { presetId: "global" });
        }, DELAY.flyIn),
        setTimeout(() => patchBootState({ phase: "booting" }), DELAY.overlayFade),
        setTimeout(() => patchBootState({ headerReady: true }), DELAY.header),
        setTimeout(() => patchBootState({ sidebarReady: true }), DELAY.sidebar),
        setTimeout(() => patchBootState({ timelineReady: true }), DELAY.timeline),
        setTimeout(() => patchBootState({ controlsReady: true }), DELAY.controls),
        setTimeout(() => patchBootState({ phase: "ready" }), DELAY.done),
    ];
}

function runCleanupBoot(): void {
    timers.forEach(clearTimeout);
    timers = [];
    bootStarted = false;
    bootState = { ...initialState };
    notifyBootListeners();
}

/**
 * Orchestrates the staggered sci-fi boot-up animation sequence.
 * Call `startBoot()` once the globe tiles have loaded.
 */
export function useBootSequence() {
    const [, bump] = useState(0);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        const listener = () => {
            if (mounted.current) bump((n) => n + 1);
        };
        listeners.add(listener);
        return () => {
            mounted.current = false;
            listeners.delete(listener);
        };
    }, []);

    const startBoot = useCallback(() => {
        runStartBoot();
    }, []);

    const cleanup = useCallback(() => {
        runCleanupBoot();
    }, []);

    return { ...bootState, startBoot, cleanup };
}
