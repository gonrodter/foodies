import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { toInternalCategory } from "@/lib/geoapify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "DB no configurada" }, { status: 500 });
  }

  const b = await req.json().catch(() => null);
  if (!b?.provider_place_id || !b?.name || b?.latitude == null || b?.longitude == null) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const provider = b.provider ?? "geoapify";
  const categories: string[] = Array.isArray(b.categories) ? b.categories : [];

  // existing? (unique provider + provider_place_id)
  const { data: existing } = await supabaseServer
    .from("places")
    .select("*")
    .eq("provider", provider)
    .eq("provider_place_id", b.provider_place_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ place: existing });
  }

  const row = {
    provider,
    provider_place_id: b.provider_place_id,
    name: b.name,
    // legacy columns kept in sync so existing UI/queries keep working
    address: b.formatted_address ?? b.address_line1 ?? null,
    city: b.city ?? "Sevilla",
    lat: b.latitude,
    lng: b.longitude,
    category: toInternalCategory(categories),
    // provider columns
    formatted_address: b.formatted_address ?? null,
    address_line1: b.address_line1 ?? null,
    address_line2: b.address_line2 ?? null,
    state: b.state ?? null,
    country: b.country ?? null,
    postcode: b.postcode ?? null,
    categories,
    raw_provider_data: b.raw_provider_data ?? null,
    verification_status: "provider_verified",
  };

  const { data, error } = await supabaseServer
    .from("places")
    .insert(row)
    .select()
    .single();

  if (error) {
    // race: another request inserted it — fetch and return
    const { data: again } = await supabaseServer
      .from("places")
      .select("*")
      .eq("provider", provider)
      .eq("provider_place_id", b.provider_place_id)
      .maybeSingle();
    if (again) return NextResponse.json({ place: again });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ place: data });
}
