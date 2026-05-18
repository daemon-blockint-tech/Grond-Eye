/**
 * Parses a `fetch` response body as JSON without throwing raw `SyntaxError` on HTML/plain-text errors.
 *
 * @param res - Response from `fetch`.
 * @returns Parsed JSON value.
 * @throws Error when the body is empty, not JSON, or the status indicates failure.
 */
export async function readJsonResponse<T = unknown>(res: Response): Promise<T> {
    const text = await res.text();
    const trimmed = text.trim();

    if (!trimmed) {
        if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
        }
        return {} as T;
    }

    try {
        return JSON.parse(trimmed) as T;
    } catch {
        const preview = trimmed.slice(0, 120).replace(/\s+/g, " ");
        throw new Error(
            res.ok
                ? `Invalid JSON response: ${preview}`
                : `Request failed (${res.status}): ${preview}`,
        );
    }
}
