"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/core/state/store";

/**
 * Applies /ops desktop layout defaults: panels closed, config panel closed unless deep-linked.
 */
export function useOpsLayoutDefaults() {
    const searchParams = useSearchParams();
    const setConfigPanelOpen = useStore((s) => s.setConfigPanelOpen);
    const setLeftPanelOpen = useStore((s) => s.setLeftPanelOpen);
    const setRightPanelOpen = useStore((s) => s.setRightPanelOpen);
    const setActiveLeftTab = useStore((s) => s.setActiveLeftTab);

    useEffect(() => {
        const openConfig = searchParams.get("config") === "1" || searchParams.get("config") === "true";
        setConfigPanelOpen(openConfig);
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
        setActiveLeftTab(null);
    }, [searchParams, setConfigPanelOpen, setLeftPanelOpen, setRightPanelOpen, setActiveLeftTab]);
}
