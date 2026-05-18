"use client";

import { useStore } from "@/core/state/store";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/core/hooks/useIsMobile";
import { trackEvent } from "@/lib/analytics";

export type PanelToggleLayout = "ops" | "legacy";

export interface PanelToggleArrowsProps {
    /** Ops shell uses opsNav; legacy AppShell uses leftSidebarOpen. */
    layout?: PanelToggleLayout;
}

/**
 * Edge toggles for left layers panel and right data configuration panel.
 * On /ops desktop, left toggle uses opsNav instead of legacy leftSidebarOpen.
 */
export function PanelToggleArrows({ layout = "legacy" }: PanelToggleArrowsProps) {
    const isMobile = useIsMobile();
    const leftSidebarOpen = useStore((s) => s.leftSidebarOpen);
    const configPanelOpen = useStore((s) => s.configPanelOpen);
    const leftPanelOpen = useStore((s) => s.leftPanelOpen);
    const openMobilePanel = useStore((s) => s.openMobilePanel);
    const mobileRightPanelGlow = useStore((s) => s.mobileRightPanelGlow);

    const toggleLeftSidebar = useStore((s) => s.toggleLeftSidebar);
    const toggleConfigPanel = useStore((s) => s.toggleConfigPanel);
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);
    const setOpenMobilePanel = useStore((s) => s.setOpenMobilePanel);

    const filterCount = useStore((s) => Object.values(s.filters).reduce((sum, pf) => sum + Object.keys(pf).length, 0));

    const isOpsLayout = layout === "ops";

    const handleLeftToggle = () => {
        if (isMobile) {
            setOpenMobilePanel("left");
        } else if (isOpsLayout) {
            toggleLeftTab("layers");
        } else {
            toggleLeftSidebar();
        }
        trackEvent("panel-toggle", { panel: "left", open: !isLeftOpen });
    };

    const handleRightToggle = () => {
        if (isMobile) {
            setOpenMobilePanel("right");
        } else {
            toggleConfigPanel();
        }
        trackEvent("panel-toggle", { panel: "right", open: !isRightOpen });
    };

    const isLeftOpen = isMobile
        ? openMobilePanel === "left"
        : isOpsLayout
            ? leftPanelOpen
            : leftSidebarOpen;
    const isRightOpen = isMobile ? openMobilePanel === "right" : configPanelOpen;

    return (
        <>
            <button
                className={`panel-toggle-btn panel-toggle-btn--left ${isLeftOpen ? "panel-toggle-btn--open" : ""} ${isMobile ? "panel-toggle-btn--mobile" : ""}`}
                onClick={handleLeftToggle}
                title="Toggle layers panel"
                data-testid="panel-toggle-left"
                type="button"
            >
                {isLeftOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>

            <button
                className={`panel-toggle-btn panel-toggle-btn--right ${isRightOpen ? "panel-toggle-btn--open" : ""} ${isMobile ? "panel-toggle-btn--mobile" : ""} ${isMobile && mobileRightPanelGlow ? "panel-toggle-btn--glow" : ""}`}
                onClick={handleRightToggle}
                title="Toggle data configuration"
                data-testid="panel-toggle-right"
                type="button"
            >
                {isRightOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}

          {filterCount > 0 && !isRightOpen && (
          <span className="filter-badge filter-badge--toggle">
            {filterCount}
          </span>
                )}
        </button>
      </>
    );
}
