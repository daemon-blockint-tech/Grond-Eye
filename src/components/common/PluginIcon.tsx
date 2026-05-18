/**
 * @file PluginIcon.tsx
 * @description Central icon resolver for plugins. Supports Lucide string names,
 * image URLs (data:, http(s):, /path), emoji fallbacks, and custom React components.
 */

"use client";

import type { ComponentType } from "react";
import { icons, type LucideIcon } from "lucide-react";
import "./PluginIcon.css";

const FallbackIcon = icons.Package;

/**
 * True when the icon string is a URL suitable for an img src (not a Lucide name or emoji).
 */
function isImageIconUrl(icon: string): boolean {
    return /^(data:image\/|https?:\/\/|\/)/i.test(icon);
}

/**
 * Props for the PluginIcon component.
 */
interface PluginIconProps {
    /**
     * The icon to render. Can be a Lucide icon name (e.g., "Airplay"),
     * a raw emoji string, or a React component.
     */
    icon: string | ComponentType<{ size?: number; color?: string }>;
    /** The size in pixels for the icon. Defaults to 18. */
    size?: number;
    /** The CSS color for the icon stroke/fill. */
    color?: string;
}

/**
 * Renders a consistent icon representation for plugins.
 * Dynamically resolves Lucide icons by name to allow plugins to declare
 * icons in their manifests without bundling dependencies.
 *
 * @param props - Component properties.
 * @returns React component for the plugin icon.
 */
export function PluginIcon({ icon, size = 18, color }: PluginIconProps) {
    if (typeof icon === "string") {
        const Resolved = icons[icon as keyof typeof icons] as LucideIcon | undefined;
        if (Resolved) return <Resolved size={size} color={color} />;
        if (isImageIconUrl(icon)) {
            return (
              <img
                src={icon}
                alt=""
                width={size}
                height={size}
                className="plugin-icon__img"
                decoding="async"
              />
            );
        }
        // Treat as emoji or short text fallback
        return <span className="plugin-icon__text">{icon}</span>;
    }

    const IconComponent = icon;
    if (IconComponent) {
        return <IconComponent size={size} color={color} />;
    }

    return <FallbackIcon size={size} />;
}
