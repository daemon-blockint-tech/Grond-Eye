"use client";

/**
 * @deprecated Boot state is a module singleton in useBootSequence.ts.
 * Re-exported for any legacy imports.
 */
export { useBootSequence as useBootSequenceContext } from "./useBootSequence";
export function BootSequenceProvider({ children }: { children: React.ReactNode }) {
    return children;
}
