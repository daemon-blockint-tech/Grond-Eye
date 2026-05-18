"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useStore } from "@/core/state/store";
import { useBootSequence } from "@/core/hooks/useBootSequence";
import { useIsMobile } from "@/core/hooks/useIsMobile";
import { trackEvent } from "@/lib/analytics";
import { readStoredTheme } from "@/core/state/themeStorage";
import { BootOverlay } from "@/components/common/BootOverlay";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { TimelineSync } from "@/core/globe/TimelineSync";
import { DataBusSubscriber } from "@/components/layout/DataBusSubscriber";
import { AgentBusSubscriber } from "@/components/layout/AgentBusSubscriber";
import { PanelToggleArrows } from "@/components/layout/PanelToggleArrows";
import { LayerPanel } from "@/components/panels/LayerPanel";
import { EntityInfoCard } from "@/components/panels/EntityInfoCard";
import { DataConfigPanel } from "@/components/panels/DataConfig";
import CameraStatsPanel from "@/components/panels/CameraStatsPanel";
import { BottomPanelManager } from "@/components/layout/BottomPanelManager";
import { FloatingVideoManager } from "@/components/video/FloatingVideoManager";
import { MobileHudBar } from "@/components/layout/MobileHudBar";
import { MobileCameraStats } from "@/components/layout/MobileCameraStats";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { OpsHeader } from "./OpsHeader";
import { LeftIconRail } from "./LeftIconRail";
import { LeftDetailPanel } from "./LeftDetailPanel";
import { MapToolbar } from "./MapToolbar";
import { GeeImageryNotice } from "./GeeImageryNotice";
import { RightOpsRail } from "./RightOpsRail";
import { GlobalTimelineFooter } from "./GlobalTimelineFooter";
import { OpsOnboarding } from "./OpsOnboarding";
import { ScenarioSync } from "./ScenarioSync";
import { useOpsLayoutDefaults } from "@/core/hooks/useOpsLayoutDefaults";
import { useOpsRightRailData } from "@/core/hooks/useOpsRightRailData";
import { useOpsKeyboard } from "@/core/hooks/useOpsKeyboard";
import "@/styles/ops-shell.css";

function OpsShellEffects() {
    useOpsLayoutDefaults();
    useOpsRightRailData();
    useOpsKeyboard();
    return null;
}

const GlobeView = dynamic(() => import("@/core/globe/GlobeView"), { ssr: false });

/**
 * Lattice-style operations shell wrapping the Cesium COP.
 */
export function OpsShell() {
    const boot = useBootSequence();
    const isMobile = useIsMobile();
    const setTheme = useStore((s) => s.setTheme);
    const activeBottomPanel = useStore((s) => s.activeBottomPanel);

    useEffect(() => {
        setTheme(readStoredTheme());
    }, [setTheme]);

    const isBooting = boot.phase !== "ready";
    const rootClasses = [
        "app-shell",
        isBooting && boot.headerReady ? "boot-header" : "",
        isBooting && boot.sidebarReady ? "boot-sidebar" : "",
        isBooting && boot.timelineReady ? "boot-timeline" : "",
        isBooting && boot.controlsReady ? "boot-controls" : "",
        !isBooting ? "boot-done" : "",
    ].filter(Boolean).join(" ");

    if (isMobile) {
        return (
          <div className={rootClasses} data-testid={!isBooting ? "app-ready" : undefined}>
            <BootOverlay visible={boot.phase === "loading"} />
            <div className="app-shell__globe">
              <GlobeView />
            </div>
            <TimelineSync />
            <DataBusSubscriber />
            <AgentBusSubscriber />
            <OpsHeader />
            <MobileHudBar />
            <MobileCameraStats />
            <PanelToggleArrows layout="ops" />
            <LayerPanel hidePluginsTab />
            <DataConfigPanel />
            <EntityInfoCard />
            <BottomPanelManager />
            <FloatingVideoManager />
            <FeedbackDialog />
          </div>
        );
    }

    return (
      <div
        className={rootClasses}
        data-testid={!isBooting ? "app-ready" : undefined}
        data-layout="ops"
      >
        <BootOverlay visible={boot.phase === "loading"} />
        <div className="app-shell__globe">
          <GlobeView />
        </div>
        <TimelineSync />
        <DataBusSubscriber />
        <AgentBusSubscriber />
        <ScenarioSync />
        <Suspense fallback={null}>
          <OpsShellEffects />
        </Suspense>

        <div className="ops-layout" data-testid="layout">
          <div className="ops-layout__top" data-testid="layout-top">
            <AnnouncementBanner />
            <OpsHeader />
          </div>
          <div className="ops-layout__center">
            <LeftIconRail />
            <LeftDetailPanel />
            <div className="ops-layout__map-stack" data-testid="cop-panel-manager">
              <GeeImageryNotice />
              <MapToolbar />
              <EntityInfoCard />
              <DataConfigPanel />
            </div>
            <RightOpsRail />
          </div>
          <GlobalTimelineFooter />
        </div>

        <PanelToggleArrows layout="ops" />
        <FloatingVideoManager />
        <FeedbackDialog />
        <OpsOnboarding />
      </div>
    );
}
