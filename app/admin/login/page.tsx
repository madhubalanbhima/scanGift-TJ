"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Login failed.");
        return;
      }

      const token = data?.token;
      if (token) {
        localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-line rounded-2xl shadow-[0_20px_50px_-20px_rgba(24,21,17,0.35)] p-8 space-y-5"
      >
        <div className="text-center">
          <div className="inline-block px-3 py-1 rounded-full border border-gold/40 text-gold-dark text-xs tracking-[0.25em] uppercase mb-3">
            Admin
          </div>
          <h1 className="font-display text-2xl text-ink">Sign in</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 border border-error/30 text-error text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-parchment/40 px-4 py-2.5 text-ink focus:border-gold focus:ring-1 focus:ring-gold outline-none transition"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gold-foil text-ink font-semibold py-3 tracking-wide hover:brightness-105 active:brightness-95 disabled:opacity-60 transition"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
