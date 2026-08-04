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
        <h1 className="text-2xl font-bold">ちかばであそぼーよ</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mt-1">
          自宅から自転車で行けるフェス・祭り・文化イベントを探せます。まずは自宅の場所を教えてください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="address">
          自宅の住所
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例: 江戸川区中央3丁目"
          className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          住所は緯度経度への変換にのみ使用し、サーバー側には保存しません。保存はこの端末のみです。
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !address.trim()}
          className="rounded-lg bg-blue-600 text-white py-2.5 font-medium disabled:opacity-50"
        >
          {submitting ? "確認中..." : "この住所で始める"}
        </button>
      </form>
    </main>
  );
}
