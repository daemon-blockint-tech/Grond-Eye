"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { isAuthEnabled, isPlatformAdmin } from "@/core/edition";
import { readJsonResponse } from "@/lib/http/readJsonResponse";
import "@/components/layout/timeSelect.css";
import "./OpsAccountMenu.css";

type SessionPayload = {
    user?: {
        email?: string | null;
        name?: string | null;
        role?: string;
    };
} | null;

/**
 * Account popover for the ops header — session email, admin link, sign out.
 */
export function OpsAccountMenu() {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState<SessionPayload>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    const loadSession = useCallback(() => {
        fetch("/api/auth/session")
            .then(async (r) => {
                if (!r.ok) return null;
                return readJsonResponse<SessionPayload>(r);
            })
            .then((s) => setSession(s))
            .catch(() => setSession(null));
    }, []);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    const toggleOpen = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setOpen((v) => !v);
    };

    const email = session?.user?.email ?? session?.user?.name ?? "Signed in";
    const showAdmin = isPlatformAdmin(session);

    return (
      <div className="ops-account-menu" ref={rootRef}>
        <button
          type="button"
          ref={buttonRef}
          className="btn btn--glow ops-account-menu__trigger"
          aria-expanded={open}
          aria-haspopup="menu"
          title="Account"
          onClick={toggleOpen}
        >
          <User size={14} />
        </button>
        {open && (
        <div
          className="dropdown-menu ops-account-menu__panel"
          role="menu"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div className="ops-account-menu__identity" role="presentation">
            <span className="ops-account-menu__email">{email}</span>
          </div>
          {showAdmin && (
          <Link
            href="/admin/overview"
            className="dropdown-option ops-account-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Settings size={14} aria-hidden />
            Grond Admin
          </Link>
                )}
          {isAuthEnabled && (
          <form action="/api/auth/signout" method="post" className="ops-account-menu__signout">
            <button type="submit" className="dropdown-option ops-account-menu__item" role="menuitem">
              <LogOut size={14} aria-hidden />
              Sign out
            </button>
          </form>
                )}
        </div>
            )}
      </div>
    );
}
