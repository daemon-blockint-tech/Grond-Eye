import { dataBus } from "@/core/data/DataBus";
import type { GeoEntity } from "@/core/plugins/PluginTypes";

/**
 * Fly the map camera to an entity with altitude-aware distance.
 */
export function flyToEntity(entity: GeoEntity): void {
    const alt = entity.altitude ?? 0;
    const distance = Math.max(5000, alt * 3 + 15000);
    dataBus.emit("cameraGoTo", {
        lat: entity.latitude,
        lon: entity.longitude,
        alt,
        distance,
        maxPitch: -35,
        heading: entity.heading,
    });
}
