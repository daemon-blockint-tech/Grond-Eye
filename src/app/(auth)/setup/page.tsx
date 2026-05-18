"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setupAction } from "@/app/setup/actions";
import styles from "@/app/setup/setup.module.css";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function SetupPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await setupAction(formData);
        if (result.success) {
            router.push("/ops");
            router.refresh();
        } else {
            setError(result.error ?? "Setup failed.");
            setLoading(false);
        }
    }

    return (
      <AuthSplitLayout tagline="Configure your operations workspace">
        <div className={styles.card}>
          <div className={styles.logo}>G</div>
          <h1 className={styles.title}>Set up Grond</h1>
          <p className={styles.subtitle}>Create the first administrator account</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="name">
              Name
              <input id="name" name="name" required className={styles.input} />
            </label>
            <label className={styles.label} htmlFor="email">
              Email
              <input id="email" name="email" type="email" required className={styles.input} />
            </label>
            <label className={styles.label} htmlFor="password">
              Password
              <input id="password" name="password" type="password" required minLength={8} className={styles.input} />
            </label>
            <label className={styles.label} htmlFor="confirm">
              Confirm password
              <input id="confirm" name="confirm" type="password" required minLength={8} className={styles.input} />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Creating…" : "Complete setup"}
            </button>
          </form>
        </div>
      </AuthSplitLayout>
    );
}
