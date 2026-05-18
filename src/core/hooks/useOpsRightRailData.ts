"use client";

import { useEffect } from "react";
import { useStore } from "@/core/state/store";
import type { OpsAlert } from "@/core/state/slices/opsAlerts";
import type { OpsTask } from "@/core/state/slices/opsTasks";
import type { OpsAuthorizationSnapshot } from "@/core/state/slices/opsAuthorization";

/**
 * Loads ops right-rail data from REST on mount.
 */
export function useOpsRightRailData() {
    const setOpsTasks = useStore((s) => s.setOpsTasks);
    const setOpsTasksLoading = useStore((s) => s.setOpsTasksLoading);
    const setOpsTasksError = useStore((s) => s.setOpsTasksError);
    const setOpsAlerts = useStore((s) => s.setOpsAlerts);
    const setOpsAlertsLoading = useStore((s) => s.setOpsAlertsLoading);
    const setOpsAuthorization = useStore((s) => s.setOpsAuthorization);
    const setOpsSimOnly = useStore((s) => s.setOpsSimOnly);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setOpsTasksLoading(true);
            setOpsAlertsLoading(true);
            try {
                const [tasksRes, alertsRes, authRes, simRes] = await Promise.all([
                    fetch("/api/ops/tasks"),
                    fetch("/api/ops/alerts"),
                    fetch("/api/ops/authorization"),
                    fetch("/api/ops/sim"),
                ]);

                if (!cancelled && tasksRes.ok) {
                    const data = await tasksRes.json();
                    setOpsTasks((data.tasks ?? []) as OpsTask[]);
                    setOpsTasksError(null);
                } else if (!cancelled && tasksRes.status === 401) {
                    setOpsTasks([]);
                } else if (!cancelled) {
                    setOpsTasksError("Could not load tasks.");
                }

                if (!cancelled && alertsRes.ok) {
                    const data = await alertsRes.json();
                    setOpsAlerts((data.alerts ?? []) as OpsAlert[]);
                }

                if (!cancelled && authRes.ok) {
                    const data = await authRes.json();
                    setOpsAuthorization(data as OpsAuthorizationSnapshot);
                }

                if (!cancelled && simRes.ok) {
                    const data = await simRes.json();
                    setOpsSimOnly(data.enabled === true);
                }
            } catch {
                if (!cancelled) setOpsTasksError("Could not load tasks.");
            } finally {
                if (!cancelled) {
                    setOpsTasksLoading(false);
                    setOpsAlertsLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [
        setOpsTasks,
        setOpsTasksLoading,
        setOpsTasksError,
        setOpsAlerts,
        setOpsAlertsLoading,
        setOpsAuthorization,
        setOpsSimOnly,
    ]);
}
