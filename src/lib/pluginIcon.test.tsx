/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PluginIcon } from "@/components/common/PluginIcon";

describe("PluginIcon", () => {
    it("renders a Lucide icon by name", () => {
        const { container } = render(<PluginIcon icon="Package" size={20} />);
        expect(container.querySelector("svg")).toBeTruthy();
        expect(container.querySelector("img")).toBeNull();
    });

    it("renders data URL icons as img elements", () => {
        const src = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
        const { container } = render(<PluginIcon icon={src} size={16} />);
        const img = container.querySelector("img.plugin-icon__img");
        expect(img).toBeTruthy();
        expect(img?.getAttribute("src")).toBe(src);
        expect(img?.getAttribute("width")).toBe("16");
    });

    it("does not render data URL text in the DOM", () => {
        const src = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
        const { container } = render(<PluginIcon icon={src} />);
        expect(container.textContent).not.toContain("data:image");
    });
});
