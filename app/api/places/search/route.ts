import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  geoapifySearch,
  PlaceResult,
  cacheGet,
  cacheSet,
  rateLimited,
} from "@/lib/geoapify";

export const runtime = "nodejs";

/* eslint-disable @typescript-eslint/no-explicit-any */
function localToResult(row: any): PlaceResult {
  return {
    id: row.id,
    source: "local",
    provider: "geoapify",
    provider_place_id: row.provider_place_id ?? "",
    name: row.name,
    formatted_address: row.formatted_address ?? row.address ?? "",
    address_line1: row.address_line1 ?? row.address ?? "",
    address_line2: row.address_line2 ?? "",
    city: row.city ?? "",
    state: row.state ?? undefined,
    country: row.country ?? "España",
    postcode: row.postcode ?? undefined,
    latitude: row.lat,
    longitude: row.lng,
    categories: row.categories ?? [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const query = (sp.get("query") ?? "").trim();
  const lat = sp.get("lat") ? Number(sp.get("lat")) : undefined;
  const lon = sp.get("lon") ? Number(sp.get("lon")) : undefined;
  const limit = Math.min(Number(sp.get("limit")) || 10, 10);

  if (query.length < 3) {
    return NextResponse.json({ error: "Mínimo 3 caracteres", results: [] }, { status: 400 });
  }

  // 1. local DB matches by name
  let local: PlaceResult[] = [];
  if (supabaseServer) {
    const { data } = await supabaseServer
      .from("places")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(limit);
    local = (data ?? []).map(localToResult);
  }

  // 2. Geoapify (cached)
  const ckey = `s:${query.toLowerCase()}:${lat?.toFixed(2)}:${lon?.toFixed(2)}`;
  let geo = cacheGet(ckey);
  if (!geo) {
    try {
      geo = await geoapifySearch({ query, lat, lon, limit: 10 });
      cacheSet(ckey, geo);
    } catch (e) {
      // degrade gracefully: still return local results
      return NextResponse.json({
        results: local,
        attribution: ATTRIBUTION,
        warning: e instanceof Error ? e.message : "Geoapify error",
      });
    }
  }

  // 3. dedup geoapify already present locally (by provider_place_id)
  const localIds = new Set(local.map((l) => l.provider_place_id).filter(Boolean));
  const geoDedup = geo.filter((g) => !localIds.has(g.provider_place_id));

  // 4. order: local first, then by distance when available
  geoDedup.sort((a, b) => (a.distance ?? 1e12) - (b.distance ?? 1e12));
  const results = [...local, ...geoDedup].slice(0, 15);

  return NextResponse.json({ results, attribution: ATTRIBUTION });
}

const ATTRIBUTION = "© OpenStreetMap contributors · Powered by Geoapify";
