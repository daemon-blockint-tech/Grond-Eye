"use client";

/**
 * Platform initialization for ops routes (plugins, host globals, marketplace).
 * Boot sequence state is a module singleton in useBootSequence (shared with OpsShell).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/core/state/store";
import { dataBus } from "@/core/data/DataBus";
import { pluginManager } from "@/core/plugins/PluginManager";
import { pluginRegistry } from "@/core/plugins/PluginRegistry";
import { useBootSequence } from "@/core/hooks/useBootSequence";
import { useMarketplaceSync } from "@/core/hooks/useMarketplaceSync";
import { injectHostGlobals } from "@/core/plugins/hostGlobals";
import { initLogCatcher } from "@/lib/logCatcher";
import { isDemo } from "@/core/edition";
import { trackEvent } from "@/lib/analytics";
import ReloadToast from "@/components/ui/ReloadToast";
import ErrorToast from "@/components/ui/ErrorToast";
import UnverifiedPluginBatchDialog from "@/components/marketplace/UnverifiedPluginBatchDialog";
import { createSimScenariosPlugin } from "@/plugins/sim-scenarios/SimScenariosPlugin";
import { SIM_SCENARIOS_PLUGIN_ID } from "@/lib/scenarios/constants";

export function PlatformBootstrap({ children }: { children: ReactNode }) {
    const initLayer = useStore((s) => s.initLayer);
    const boot = useBootSequence();
    const bootStartRef = useRef(Date.now());
    const [hostReady, setHostReady] = useState(false);
    const {
        needsReload,
        pendingUnverified,
        approveSelected,
        denyAll,
    } = useMarketplaceSync(hostReady);

    useEffect(() => {
        const startPlatform = async () => {
            initLogCatcher();
            console.log("[PlatformBootstrap] Initializing platform…");

            await injectHostGlobals();
            setHostReady(true);

            let disabledIds = new Set<string>();
            try {
                const res = await fetch("/api/marketplace/disabled-builtins");
                if (res.ok) {
                    const data = await res.json();
                    disabledIds = new Set<string>(data.disabledIds ?? []);
                }
            } catch {
                /* non-critical */
            }

            const demoDefaultPlugins = new Set<string>();
            if (isDemo) {
                const envVar = process.env.NEXT_PUBLIC_DEMO_DEFAULT_PLUGINS || "";
                envVar.split(",").forEach((s) => {
                    const clean = s.trim();
                    if (clean) demoDefaultPlugins.add(clean);
                });
            }

            await pluginManager.init();

            if (!pluginRegistry.has(SIM_SCENARIOS_PLUGIN_ID)) {
                pluginRegistry.register(createSimScenariosPlugin());
            }

            for (const plugin of pluginRegistry.getAll()) {
                await pluginManager.registerPlugin(plugin);
                let shouldEnable = false;
                if (isDemo) {
                    shouldEnable = demoDefaultPlugins.has(plugin.id);
                } else {
                    shouldEnable = !disabledIds.has(plugin.id);
                }
                initLayer(plugin.id, shouldEnable);
                if (shouldEnable) {
                    await pluginManager.enablePlugin(plugin.id);
                }
            }

            console.log("[PlatformBootstrap] Platform ready — waiting for globe tiles…");
        };

        const unsubGlobe = dataBus.on("globeReady", () => {
            console.log("[PlatformBootstrap] Globe ready — starting boot sequence.");
            boot.startBoot();
        });

        const bootFailsafe = setTimeout(() => {
            console.warn(
                "[PlatformBootstrap] globeReady not received within 10s — starting boot anyway.",
            );
            boot.startBoot();
        }, 10_000);

        startPlatform();

        return () => {
            clearTimeout(bootFailsafe);
            unsubGlobe();
            boot.cleanup();
            pluginManager.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initLayer]);

    useEffect(() => {
        if (boot.phase === "ready") {
            const duration = Date.now() - bootStartRef.current;
            trackEvent("platform-boot", { duration });
        }
    }, [boot.phase]);

    return (
      <>
        {children}
        {needsReload && <ReloadToast />}
        <ErrorToast />
        {pendingUnverified.length > 0 && (
        <UnverifiedPluginBatchDialog
          manifests={pendingUnverified}
          onApproveSelected={approveSelected}
          onDenyAll={denyAll}
        />
            )}
      </>
    );
}
