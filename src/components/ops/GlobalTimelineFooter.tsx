"use client";

import { Timeline } from "@/components/timeline/Timeline";
import { BottomPanelManager } from "@/components/layout/BottomPanelManager";

/**
 * Footer region with live timeline scrubber (Lattice global-time-scrubber).
 */
export function GlobalTimelineFooter() {
    return (
      <footer className="ops-layout__footer glass-panel" data-testid="global-time-scrubber">
        <Timeline />
        <BottomPanelManager />
      </footer>
    );
}
