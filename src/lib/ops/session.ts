import { auth } from "@/lib/auth";

/**
 * Resolves the authenticated user id for ops API routes.
 */
export async function getOpsUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}
