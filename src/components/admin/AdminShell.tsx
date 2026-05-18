"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/styles/admin-shell.css";

const NAV = [
    { href: "/admin/overview", label: "Overview" },
    { href: "/admin/plugins", label: "Plugins" },
    { href: "/ops", label: "Operations" },
];

/**
 * Admin dashboard chrome (no globe).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
      <div className="admin-layout" data-testid="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">G</span>
            Grond Admin
          </div>
          <nav className="admin-nav" aria-label="Admin">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav__link ${pathname === item.href ? "admin-nav__link--active" : ""}`}
              >
                {item.label}
              </Link>
                    ))}
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    );
}
