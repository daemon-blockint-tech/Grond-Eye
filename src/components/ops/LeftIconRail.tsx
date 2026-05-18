"use client";

import {
    Clock, Layers, MapPin, Star, Radio, Import
} from "lucide-react";
import { useStore } from "@/core/state/store";
import type { OpsLeftTab } from "@/core/state/slices/opsNav";

const TABS: { id: Exclude<OpsLeftTab, null>; label: string; icon: typeof Layers }[] = [
    { id: "tracks", label: "Assets", icon: Radio },
    { id: "layers", label: "Layers", icon: Layers },
    { id: "assets", label: "Cameras", icon: MapPin },
    { id: "geo", label: "Geo", icon: Import },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "starred", label: "Starred", icon: Star },
];

/**
 * Vertical icon rail for left ops navigation.
 */
export function LeftIconRail() {
    const activeLeftTab = useStore((s) => s.activeLeftTab);
    const leftPanelOpen = useStore((s) => s.leftPanelOpen);
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);

    return (
      <nav className="ops-left-rail" data-testid="left-sidebar" aria-label="Operations panels">
        {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = leftPanelOpen && activeLeftTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`ops-left-rail__btn ${active ? "ops-left-rail__btn--active" : ""}`}
                    title={tab.label}
                    aria-label={tab.label}
                    aria-pressed={active}
                    onClick={() => toggleLeftTab(tab.id)}
                  >
                    <Icon size={16} />
                  </button>
                );
            })}
      </nav>
    );
}
