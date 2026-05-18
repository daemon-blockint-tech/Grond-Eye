"use client";

import { useState } from "react";
import { getOpsBannerEnabled, getOpsBannerUrl } from "@/core/grondEnv";
import { X } from "lucide-react";

const DISMISS_KEY = "grond-ops-banner-dismissed";

/**
 * Optional env-driven banner above the ops header.
 */
export function AnnouncementBanner() {
    const enabled = getOpsBannerEnabled();
    const url = getOpsBannerUrl();
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return localStorage.getItem(DISMISS_KEY) === "1";
        } catch {
            return false;
        }
    });

    if (!enabled || dismissed) return null;

    return (
      <div
        className="ops-announcement"
        data-testid="layout-top-banner"
        role="region"
        aria-label="Announcement"
      >
        <span>Welcome to Grond Operations. Configure layers and tracks from the left rail.</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyan)" }}>
            Read more
          </a>
                )}
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => {
                        try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
                        setDismissed(true);
                    }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </span>
      </div>
    );
}
