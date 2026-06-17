import { NextRequest, NextResponse } from "next/server";
import { geoapifyNearby, cacheGet, cacheSet, rateLimited } from "@/lib/geoapify";

export const runtime = "nodejs";

const ATTRIBUTION = "© OpenStreetMap contributors · Powered by Geoapify";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat y lon requeridos" }, { status: 400 });
  }
  const radius = Math.min(Number(sp.get("radius")) || 1500, 5000);
  const limit = Math.min(Number(sp.get("limit")) || 20, 50);

  const ckey = `n:${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}:${limit}`;
  let results = cacheGet(ckey);
  if (!results) {
    try {
      results = await geoapifyNearby({ lat, lon, radius, limit });
      cacheSet(ckey, results);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Geoapify error" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ results, attribution: ATTRIBUTION });
}
