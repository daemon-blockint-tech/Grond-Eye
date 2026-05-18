import { describe, expect, it } from "vitest";
import { readJsonResponse } from "./readJsonResponse";

function mockResponse(body: string, status = 200, ok = status >= 200 && status < 300): Response {
    return {
        ok,
        status,
        text: async () => body,
    } as Response;
}

describe("readJsonResponse", () => {
    it("parses valid JSON on success", async () => {
        const data = await readJsonResponse<{ configured: boolean }>(
            mockResponse('{"configured":true}'),
        );
        expect(data.configured).toBe(true);
    });

    it("throws a descriptive error for Internal Server Error text", async () => {
        await expect(
            readJsonResponse(mockResponse("Internal Server Error", 500, false)),
        ).rejects.toThrow(/Request failed \(500\): Internal Server Error/);
    });

    it("throws when ok response is not JSON", async () => {
        await expect(
            readJsonResponse(mockResponse("not json", 200, true)),
        ).rejects.toThrow(/Invalid JSON response/);
    });
});
