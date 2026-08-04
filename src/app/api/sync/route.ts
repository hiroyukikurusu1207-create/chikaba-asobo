import { NextResponse } from "next/server";
import { scrapeMunicipalityEvents } from "@/lib/scraper";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

async function isAuthorized(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return isAdminAuthenticated();
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const events = await scrapeMunicipalityEvents();
  const supabase = createServiceRoleClient();

  const { error, count } = await supabase
    .from("events")
    .upsert(
      events.map((e) => ({
        title: e.title,
        genre: e.genre,
        start_date: e.startDate,
        end_date: e.endDate,
        venue_name: e.venueName,
        address: e.address,
        lat: e.lat,
        lng: e.lng,
        source: e.source,
        source_url: e.sourceUrl,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "source_url", count: "exact" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scraped: events.length, upserted: count });
}

// Vercel Cronは既定でGETを送るため、GETでも同じ処理を実行できるようにする
export async function GET(request: Request) {
  return POST(request);
}
