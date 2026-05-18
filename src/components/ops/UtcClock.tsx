"use client";

import { useEffect, useState } from "react";

/**
 * Monospace UTC clock for the ops header.
 */
export function UtcClock() {
    const [label, setLabel] = useState("");
    const [dateTime, setDateTime] = useState<string | null>(null);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setDateTime(now.toISOString());
            const parts = new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "UTC",
            }).formatToParts(now);
            const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
            setLabel(
                `${get("weekday").toUpperCase()} ${get("day")} ${get("month").toUpperCase()} ${get("year")}, `
                + `${get("hour")}:${get("minute")}:${get("second")}Z`,
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
      <time
        dateTime={dateTime ?? undefined}
        data-testid="ops-utc-clock"
        suppressHydrationWarning
        style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 12,
                letterSpacing: "0.04em",
                color: "var(--text-secondary)",
            }}
      >
        {label || "\u00a0"}
      </time>
    );
}
