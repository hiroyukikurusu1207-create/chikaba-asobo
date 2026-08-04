import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocodeClient";

export async function POST(request: Request) {
  const { address } = (await request.json()) as { address?: string };
  if (!address || !address.trim()) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const result = await geocodeAddress(address.trim());
  if (!result) {
    return NextResponse.json({ error: "住所が見つかりませんでした" }, { status: 404 });
  }

  return NextResponse.json(result);
}
