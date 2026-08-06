"use client";

import { useState } from "react";
import { guessGenre } from "@/lib/urlImport";

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

type ExtractedFields = {
  title: string | null;
  genre: string | null;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
  address: string | null;
  eventTime: string | null;
  targetAge: string | null;
  cost: string | null;
};

async function extractFromUrl(url: string): Promise<{ result?: ExtractedFields; error?: string }> {
  const res = await fetch("/api/admin/extract-from-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) return { error: body?.error ?? "取り込みに失敗しました" };
  return { result: body.result as ExtractedFields };
}

export function AdminDashboard() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setForm((prev) => {
      // ジャンルを未入力のまま残しているときだけ、タイトルからの自動推測で上書きする
      // （すでに手で入力・修正したジャンルを勝手に書き換えないため）
      const guessed = prev.genre ? prev.genre : (guessGenre(value) ?? "");
      return { ...prev, title: value, genre: guessed };
    });
  }

  function mergeExtracted(prev: typeof emptyForm, r: ExtractedFields, sourceUrl: string) {
    return {
      ...prev,
      title: r.title ?? prev.title,
      genre: r.genre ?? prev.genre,
      startDate: r.startDate ?? prev.startDate,
      endDate: r.endDate ?? prev.endDate,
      venueName: r.venueName ?? prev.venueName,
      address: r.address ?? prev.address,
      eventTime: r.eventTime ?? prev.eventTime,
      targetAge: r.targetAge ?? prev.targetAge,
      cost: r.cost ?? prev.cost,
      sourceUrl,
    };
  }

  async function handleImportFromUrl() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const { result, error } = await extractFromUrl(importUrl.trim());
      if (!result) {
        setImportMessage(error ?? "取り込みに失敗しました");
        return;
      }
      setForm((prev) => mergeExtracted(prev, result, importUrl.trim()));
      setImportMessage("下のフォームに仮入力しました。内容を確認してから追加してください");
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      let current = form;

      // タイトル・開始日が未入力でも参照URLさえあれば追加できるよう、
      // 不足分は送信前に自動で取り込む
      if ((!current.title || !current.startDate) && current.sourceUrl.trim()) {
        const { result, error } = await extractFromUrl(current.sourceUrl.trim());
        if (!result) {
          setMessage(error ?? "参照URLからの取り込みに失敗しました");
          return;
        }
        current = mergeExtracted(current, result, current.sourceUrl.trim());
        setForm(current);
        if (!current.title || !current.startDate) {
          setMessage(
            "参照URLからタイトル・開催日を読み取れませんでした。フォームを確認し、手動で入力してください",
          );
          return;
        }
      }

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          genre: current.genre
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
          startDate: current.startDate,
          endDate: current.endDate || null,
          venueName: current.venueName || null,
          address: current.address || null,
          description: current.description || null,
          targetAge: current.targetAge || null,
          eventTime: current.eventTime || null,
          cost: current.cost || null,
          sourceUrl: current.sourceUrl || null,
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

      <section className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-2">
        <p className="text-sm font-bold">URLから取り込む</p>
        <p className="text-xs text-muted">
          イベントページのURLを貼ると、下のフォームに内容を仮入力します（読み取り精度はサイトによって異なるため、必ず内容を確認してください）。
        </p>
        <div className="flex gap-2">
          <input
            placeholder="https://..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="flex-1 rounded-xl border border-card-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleImportFromUrl}
            disabled={importing || !importUrl.trim()}
            className="shrink-0 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-extrabold shadow-sm disabled:opacity-50"
          >
            {importing ? "取り込み中..." : "取り込む"}
          </button>
        </div>
        {importMessage && <p className="text-xs text-muted">{importMessage}</p>}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-card border border-card-border shadow-sm p-4 flex flex-col gap-3"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold">イベントを手動追加</p>
          <p className="text-xs text-muted">＊は必須項目です</p>
        </div>
        <input
          placeholder="タイトル *"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
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
        <p className="text-xs text-muted -mt-1">
          参照URLだけ入力して「追加する」を押すと、他の項目を自動で取り込みます
        </p>
        {message && <p className="text-sm font-bold">{message}</p>}
        <button
          type="submit"
          disabled={
            submitting || (!form.sourceUrl.trim() && (!form.title || !form.startDate))
          }
          className="rounded-full bg-primary text-primary-foreground py-2.5 font-extrabold shadow-sm disabled:opacity-50"
        >
          {submitting ? "追加中..." : "追加する"}
        </button>
      </form>
    </div>
  );
}
