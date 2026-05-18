import {
 useState, useCallback, useRef, type DragEvent
} from "react";
import { normalizeToGeoJson, type NormalizeResult, type ConvertOptions } from "@/lib/geojson";

import { dataBus } from "@/core/data/DataBus";
import { trackEvent } from "@/lib/analytics";
import { useGeoJsonStore } from "./geojsonStore";
import { createGeoJsonPlugin, pickLayerColor } from "./GeoJsonImporterPlugin";
import type { ImportMethod } from "./types";

export function useGeoJsonImport(onClose: () => void) {
    const [method, setMethod] = useState<ImportMethod>("file");
    const [textInput, setTextInput] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(() => pickLayerColor(useGeoJsonStore.getState().importedLayers.length),);
    const [preview, setPreview] = useState<NormalizeResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const addLayer = useGeoJsonStore((s) => s.addImportedLayer);

    const processInput = useCallback(
        (raw: string | unknown, options?: ConvertOptions) => {
            setError(null);
            setPreview(null);

            if (raw instanceof File || raw instanceof Blob) {
                setError("Select the File tab to upload — do not paste a file object as text.");
                return;
            }

            try {
                const result = normalizeToGeoJson(raw, options);
                setPreview(result);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                if (message.includes("Unrecognized format")) {
                    setError(
                        `${message} For large files like military_bases.geojson (~6.6 MB), use the File tab or Load from URL — do not paste into the text box.`,
                    );
                    return;
                }
                setError(message);
            }
        },
        [],
    );

    const handleFile = useCallback(
        (file: File) => {
            setName(file.name.replace(/\.(geo)?json$/i, ""));
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result;
                if (typeof text !== "string" || text.trim() === "") {
                    setError("File is empty or could not be read as text.");
                    return;
                }
                processInput(text);
            };
            reader.onerror = () => setError("Failed to read file.");
            reader.readAsText(file);
        },
        [processInput],
    );

    const loadFromUrl = useCallback(
        async (url: string) => {
            setError(null);
            setPreview(null);
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${url} (${res.status})`);
                }
                const text = await res.text();
                const label = url.split("/").pop()?.replace(/\.(geo)?json$/i, "") ?? "imported";
                setName(label);
                processInput(text);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load URL");
            }
        },
        [processInput],
    );

    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile],
    );

    const handleConfirm = async () => {
        if (!preview) return;
        const layerName = name.trim() || "Untitled Layer";
        const layerId = `geojson-${Date.now()}`;

        // 1. Store metadata
        addLayer({
            id: layerId,
            name: layerName,
            description: description.trim(),
            color,
            visible: true,
            featureCollection: preview.collection,
        });

        // 2. Register dynamic plugin via DataBus
        const plugin = createGeoJsonPlugin({
            id: layerId,
            name: layerName,
            description: description.trim() || `Imported GeoJSON (${preview.collection.features.length} features)`,
            color,
            featureCollection: preview.collection,
        });

        dataBus.emit("dynamicPluginCreate", { plugin, autoEnable: true });

        trackEvent("geojson-import", { featureCount: preview.collection.features.length });
        onClose();
    };

    return {
        method,
setMethod,
        textInput,
setTextInput,
        name,
setName,
        description,
setDescription,
        color,
setColor,
        preview,
setPreview,
        error,
setError,
        dragging,
setDragging,
        fileRef,
        processInput,
        handleFile,
        handleDrop,
        handleConfirm,
        loadFromUrl,
    };
}
