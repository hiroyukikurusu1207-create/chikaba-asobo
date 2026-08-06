import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { geocodeAddress } from "@/lib/geocodeClient";
import { createServiceRoleClient } from "@/lib/supabase/server";

type NewEventPayload = {
  title: string;
  genre: string[];
  startDate: string;
  endDate?: string | null;
  venueName?: string | null;
  address?: string | null;
  description?: string | null;
  targetAge?: string | null;
  eventTime?: string | null;
  cost?: string | null;
  sourceUrl?: string | null;
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as NewEventPayload;
  if (!body.title?.trim() || !body.startDate) {
    return NextResponse.json({ error: "title と startDate は必須です" }, { status: 400 });
  }

  let lat: number | null = null;
  let lng: number | null = null;
  if (body.address?.trim()) {
    const geocoded = await geocodeAddress(body.address.trim());
    if (geocoded) {
      lat = geocoded.lat;
      lng = geocoded.lng;
    }
  }

  const supabase = createServiceRoleClient();
  const { error, data } = await supabase
    .from("events")
    .insert({
      title: body.title.trim(),
      genre: body.genre ?? [],
      start_date: body.startDate,
      end_date: body.endDate || null,
      venue_name: body.venueName?.trim() || null,
      address: body.address?.trim() || null,
      lat,
      lng,
      description: body.description?.trim() || null,
      target_age: body.targetAge?.trim() || null,
      event_time: body.eventTime?.trim() || null,
      cost: body.cost?.trim() || null,
      source: "manual",
      source_url: body.sourceUrl?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "この参照URLのイベントはすでに追加されています" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
