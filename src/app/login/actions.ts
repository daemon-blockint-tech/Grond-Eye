"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isCloud } from "@/core/edition";
import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "@/lib/supabase-config";

interface LoginResult {
    success: boolean;
    error?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabaseConfig = resolveSupabaseConfig();
    const isDummyUrl =
        !supabaseConfig?.url ||
        supabaseConfig.url.includes("dummy") ||
        supabaseConfig.url.includes("xyz.supabase.co");

    if (isCloud && supabaseConfig && !isDummyUrl) {
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
    }
        try {
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            return { success: true };
        } catch (error) {
            if (error instanceof AuthError) {
                return {
                    success: false,
                    error: error.type === "CredentialsSignin"
                        ? "Invalid email or password."
                        : "Something went wrong.",
                };
            }
            throw error;
        }
}
