"use client";

import { useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("パスワードが違います");
        return;
      }
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-3"
    >
      <label className="text-sm font-bold" htmlFor="admin-password">
        パスワード
      </label>
      <input
        id="admin-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
      />
      {error && <p className="text-sm font-bold text-accent">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !password}
        className="rounded-full bg-primary text-primary-foreground py-2.5 font-extrabold shadow-sm disabled:opacity-50"
      >
        ログイン
      </button>
    </form>
  );
}
