import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { extractEventFromUrl } from "@/lib/urlImport";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "URLを入力してください" }, { status: 400 });
  }

  try {
    const result = await extractEventFromUrl(url);
    return NextResponse.json({ result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "取り込みに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
