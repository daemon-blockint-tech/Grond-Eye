"use client";

import { useEffect } from "react";
import { useStore } from "@/core/state/store";

/**
 * Escape closes ops left/right detail panels when open.
 */
export function useOpsKeyboard() {
    const setLeftPanelOpen = useStore((s) => s.setLeftPanelOpen);
    const setRightPanelOpen = useStore((s) => s.setRightPanelOpen);
    const setConfigPanelOpen = useStore((s) => s.setConfigPanelOpen);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            const onOps = document.querySelector("[data-layout=\"ops\"]");
            if (!onOps) return;
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
            setConfigPanelOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [setLeftPanelOpen, setRightPanelOpen, setConfigPanelOpen]);
}
