"use client";

import { useState } from "react";

const emptyForm = {
  title: "",
  genre: "",
  startDate: "",
  endDate: "",
  venueName: "",
  address: "",
  description: "",
  targetAge: "",
  eventTime: "",
  cost: "",
  sourceUrl: "",
};

export function AdminDashboard() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          genre: form.genre
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
          startDate: form.startDate,
          endDate: form.endDate || null,
          venueName: form.venueName || null,
          address: form.address || null,
          description: form.description || null,
          targetAge: form.targetAge || null,
          eventTime: form.eventTime || null,
          cost: form.cost || null,
          sourceUrl: form.sourceUrl || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error ?? "追加に失敗しました");
        return;
      }
      setForm(emptyForm);
      setMessage("追加しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSyncMessage(body?.error ?? "同期に失敗しました");
        return;
      }
      setSyncMessage(`取得${body.scraped}件・保存${body.upserted}件`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-2">
        <p className="text-sm font-bold">自治体公式カレンダーの同期</p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="self-start rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-extrabold shadow-sm disabled:opacity-50"
        >
          {syncing ? "実行中..." : "今すぐ同期を実行"}
        </button>
        {syncMessage && <p className="text-xs text-muted">{syncMessage}</p>}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-3"
      >
        <p className="text-sm font-bold">イベントを手動追加</p>
        <input
          placeholder="タイトル *"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <input
          placeholder="ジャンル（カンマ区切り 例: お祭り,文化・芸術）"
          value={form.genre}
          onChange={(e) => update("genre", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input
            type="date"
            placeholder="開始日 *"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
          <input
            type="date"
            placeholder="終了日"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </div>
        <input
          placeholder="会場名"
          value={form.venueName}
          onChange={(e) => update("venueName", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <input
          placeholder="住所（分かる範囲で。地図検索に使用します）"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input
            placeholder="開催時間（例: 10:00〜17:00）"
            value={form.eventTime}
            onChange={(e) => update("eventTime", e.target.value)}
            className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
          <input
            placeholder="対象年齢（例: どなたでも）"
            value={form.targetAge}
            onChange={(e) => update("targetAge", e.target.value)}
            className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
        </div>
        <input
          placeholder="費用（例: 無料、大人300円）"
          value={form.cost}
          onChange={(e) => update("cost", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        <textarea
          placeholder="説明"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          rows={3}
        />
        <input
          placeholder="参照URL"
          value={form.sourceUrl}
          onChange={(e) => update("sourceUrl", e.target.value)}
          className="rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
        />
        {message && <p className="text-sm font-bold">{message}</p>}
        <button
          type="submit"
          disabled={submitting || !form.title || !form.startDate}
          className="rounded-full bg-primary text-primary-foreground py-2.5 font-extrabold shadow-sm disabled:opacity-50"
        >
          {submitting ? "追加中..." : "追加する"}
        </button>
      </form>
    </div>
  );
}
