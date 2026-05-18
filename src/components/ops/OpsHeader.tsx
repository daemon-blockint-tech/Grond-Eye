"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpCircle, Menu } from "lucide-react";
import { isDemo, DEMO_ADMIN_ROLE } from "@/core/edition";
import { useStore } from "@/core/state/store";
import { UtcClock } from "./UtcClock";
import { OpsAccountMenu } from "./OpsAccountMenu";
import { replayOpsOnboarding } from "./OpsOnboarding";
import { readJsonResponse } from "@/lib/http/readJsonResponse";

/**
 * Lattice-minimal operations header (LIVE badge, UTC clock, account menu).
 */
export function OpsHeader() {
    const [isDemoAdmin, setIsDemoAdmin] = useState(false);
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);

    useEffect(() => {
        if (!isDemo) return;
        fetch("/api/auth/session")
            .then(async (r) => {
                if (!r.ok) return null;
                return readJsonResponse<{ user?: { role?: string } }>(r);
            })
            .then((s) => setIsDemoAdmin(s?.user?.role === DEMO_ADMIN_ROLE))
            .catch(() => {});
    }, []);

    return (
      <header className="ops-header-bar glass-panel" data-testid="layout-top-header">
        <div className="ops-header__cluster ops-header__cluster--start">
          <button
            type="button"
            className="btn btn--glow ops-header__icon-btn"
            aria-label="Open layers"
            onClick={() => toggleLeftTab("layers")}
          >
            <Menu size={16} />
          </button>
          <Link href="/ops" className="ops-header__brand">
            <img
              src="/logo/Grond_White_Logo.svg"
              alt="Grond"
              className="ops-header__logo"
              width={111}
              height={24}
            />
          </Link>
          <span className="status-badge">
            <span className="status-badge__dot" />
            LIVE
          </span>
          {isDemoAdmin && (
          <span className="alpha-badge ops-header__admin-badge">ADMIN</span>
                )}
        </div>
        <div className="ops-header__cluster ops-header__cluster--end">
          <button
            type="button"
            className="btn btn--glow ops-header__help"
            title="Help"
            onClick={() => replayOpsOnboarding()}
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>
          <UtcClock />
          <OpsAccountMenu />
        </div>
      </header>
    );
}
