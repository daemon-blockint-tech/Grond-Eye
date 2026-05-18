import { describe, expect, it } from "vitest";
import { distanceNm, pointInPolygon } from "../rules/geo";

describe("distanceNm", () => {
    it("returns ~0 for identical points", () => {
        expect(distanceNm(37.8, -122.4, 37.8, -122.4)).toBeLessThan(0.01);
    });

    it("returns positive distance for separated points", () => {
        const d = distanceNm(37.8, -122.4, 37.9, -122.3);
        expect(d).toBeGreaterThan(5);
    });
});

describe("pointInPolygon", () => {
    const square: Array<[number, number]> = [
        [-122.43, 37.80],
        [-122.41, 37.80],
        [-122.41, 37.82],
        [-122.43, 37.82],
    ];

    it("detects point inside polygon", () => {
        expect(pointInPolygon(37.81, -122.42, square)).toBe(true);
    });

    it("detects point outside polygon", () => {
        expect(pointInPolygon(37.79, -122.42, square)).toBe(false);
    });
});
