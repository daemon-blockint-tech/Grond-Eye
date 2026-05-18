import { describe, expect, it } from "vitest";
import { looksLikeCoordinates, parseCoordinates } from "./parseCoordinates";

describe("parseCoordinates", () => {
    it("parses comma-separated decimal degrees", () => {
        expect(parseCoordinates("37.8269, -122.4230")).toEqual({
            lat: 37.8269,
            lon: -122.423,
        });
    });

    it("parses space-separated decimal degrees", () => {
        expect(parseCoordinates("33.54 -117.6")).toEqual({
            lat: 33.54,
            lon: -117.6,
        });
    });

    it("parses semicolon-separated pair", () => {
        expect(parseCoordinates("0; 0")).toEqual({ lat: 0, lon: 0 });
    });

    it("rejects out-of-range latitude", () => {
        expect(parseCoordinates("91, 0")).toBeNull();
        expect(parseCoordinates("-90.1, 10")).toBeNull();
    });

    it("rejects out-of-range longitude", () => {
        expect(parseCoordinates("0, 181")).toBeNull();
        expect(parseCoordinates("10, -180.1")).toBeNull();
    });

    it("rejects single numbers and place names", () => {
        expect(parseCoordinates("37.8269")).toBeNull();
        expect(parseCoordinates("Alcatraz Island")).toBeNull();
        expect(parseCoordinates("")).toBeNull();
    });
});

describe("looksLikeCoordinates", () => {
    it("detects partial coordinate input", () => {
        expect(looksLikeCoordinates("37.8,")).toBe(true);
        expect(looksLikeCoordinates("37.83 -")).toBe(true);
    });

    it("returns false for place names", () => {
        expect(looksLikeCoordinates("Pulau Alcatraz")).toBe(false);
    });
});
