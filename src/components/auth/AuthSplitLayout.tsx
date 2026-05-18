"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import "./auth-layout.css";

type AuthSplitLayoutProps = {
    children: ReactNode;
    tagline?: string;
};

/**
 * Split auth shell (React Bits auth-2 layout) — hero left, form right on large screens.
 */
export function AuthSplitLayout({
    children,
    tagline = "Real-time geospatial intelligence",
}: AuthSplitLayoutProps) {
    return (
      <motion.div className="auth-split">
        <aside className="auth-split__hero" aria-hidden>
          <motion.div
            className="auth-split__hero-inner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-split__hero-bg" />
            <div className="auth-split__brand">
              <Image
                src="/logo/Grond_White_Logo.svg"
                alt="Grond"
                width={140}
                height={30}
                className="auth-split__logo-img"
                priority
              />
            </div>
            <h2 className="auth-split__tagline">{tagline}</h2>
          </motion.div>
        </aside>
        <main className="auth-split__main">
          <motion.div
            className="auth-split__panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    );
}
