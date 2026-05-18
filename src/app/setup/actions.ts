"use server";

import { hashSync } from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

interface SetupResult {
    success: boolean;
    error?: string;
}

/** Create the initial admin account. Rejects if any user already exists. */
export async function createAdminAccount(formData: FormData): Promise<SetupResult> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (!name || !email || !password) {
        return { success: false, error: "All fields are required." };
    }
    if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." };
    }
    if (password !== confirm) {
        return { success: false, error: "Passwords do not match." };
    }

    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
        return { success: false, error: "Admin account already exists." };
    }

    const hashedPassword = hashSync(password, 12);
    await prisma.user.create({
        data: {
            name,
            email,
            hashedPassword,
            role: "admin",
        },
    });

    return { success: true };
}

/**
 * Creates the first admin, then signs in so /ops is reachable immediately.
 */
export async function setupAction(formData: FormData): Promise<SetupResult> {
    const result = await createAdminAccount(formData);
    if (!result.success) return result;

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", { email, password, redirect: false });
    } catch (error) {
        if (error instanceof AuthError) {
            return {
                success: false,
                error: "Account created but sign-in failed. Try logging in manually.",
            };
        }
        throw error;
    }

    return { success: true };
}
