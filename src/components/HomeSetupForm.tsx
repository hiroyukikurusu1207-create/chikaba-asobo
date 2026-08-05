"use client";

import { useState } from "react";
import type { HomeLocation } from "@/hooks/useHomeLocation";

export function HomeSetupForm({
  onSaved,
  initialAddress,
}: {
  onSaved: (home: HomeLocation) => void;
  initialAddress?: string;
}) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "住所を確認できませんでした");
        return;
      }
      const { lat, lng } = await res.json();
      onSaved({ lat, lng, address: address.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          ちかばで<span className="text-accent">あそぼーよ</span>
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          自宅からの移動時間で、フェス・祭り・文化イベントをのんびり探せます。まずは自宅の場所を教えてください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-3">
        <label className="text-sm font-bold" htmlFor="address">
          自宅の住所
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例: 江戸川区中央3丁目"
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <p className="text-xs text-muted">
          住所は緯度経度への変換にのみ使用し、サーバー側には保存しません。保存はこの端末のみです。
        </p>
        {error && <p className="text-sm font-bold text-accent">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !address.trim()}
          className="rounded-full bg-primary text-primary-foreground py-2.5 font-extrabold shadow-sm disabled:opacity-50"
        >
          {submitting ? "確認中..." : "この住所で始める"}
        </button>
      </form>
    </main>
  );
}
