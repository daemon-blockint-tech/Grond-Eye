import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
    try {
        const response = await fetch("https://www.submarinecablemap.com/api/v3/cable/cable-geo.json", {
            headers: {
                "User-Agent": "Grond/1.0",
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch from target URL (Status: ${response.status})` },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[UnderseaCablesProxy] Error:", error);
        return NextResponse.json(
            { error: "Failed to proxy request" },
            { status: 500 },
        );
    }
}
