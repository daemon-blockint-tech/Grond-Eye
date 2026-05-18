import "@/styles/ops-shell.css";
import { PlatformBootstrap } from "@/components/platform/PlatformBootstrap";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
    return (
      <PlatformBootstrap>
        {children}
      </PlatformBootstrap>
    );
}
