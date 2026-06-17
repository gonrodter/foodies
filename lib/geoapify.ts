// Geoapify Places provider (server-only — never import from client code).
// Normalizes Geoapify features into our unified PlaceResult shape.

import { Category } from "./types";

export const CATERING_CATEGORIES = [
  "catering.restaurant",
  "catering.cafe",
  "catering.bar",
  "catering.pub",
  "catering.fast_food",
  "catering.food_court",
  "catering.ice_cream",
] as const;

// Sevilla centre — default search area when the client sends no coords.
export const SEVILLE = { lat: 37.3891, lon: -5.9845 };

export type PlaceResult = {
  id?: string;
  source: "local" | "geoapify";
  provider: "geoapify";
  provider_place_id: string;
  name: string;
  formatted_address: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state?: string;
  country: string;
  postcode?: string;
  latitude: number;
  longitude: number;
  categories: string[];
  distance?: number;
  raw_provider_data?: Record<string, unknown>;
};

// Map Geoapify catering categories to our internal enum.
export function toInternalCategory(categories: string[] = []): Category {
  const has = (c: string) => categories.some((x) => x.includes(c));
  if (has("ice_cream")) return "dessert";
  if (has("cafe") || has("coffee")) return "coffee";
  if (has("bar") || has("pub")) return "bar";
  if (has("restaurant") || has("fast_food") || has("food_court")) return "food";
  return "other";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeFeature(f: any): PlaceResult | null {
  const p = f?.properties ?? f;
  const id = p?.place_id;
  const name = p?.name;
  if (!id || !name) return null;
  return {
    source: "geoapify",
    provider: "geoapify",
    provider_place_id: String(id),
    name,
    formatted_address: p.formatted ?? "",
    address_line1: p.address_line1 ?? p.street ?? "",
    address_line2: p.address_line2 ?? "",
    city: p.city ?? p.town ?? p.village ?? p.county ?? "",
    state: p.state ?? undefined,
    country: p.country ?? "",
    postcode: p.postcode ?? undefined,
    latitude: p.lat,
    longitude: p.lon,
    categories: Array.isArray(p.categories) ? p.categories : [],
    distance: typeof p.distance === "number" ? p.distance : undefined,
    raw_provider_data: p,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const KEY = () => process.env.GEOAPIFY_API_KEY;
const BASE = "https://api.geoapify.com/v2/places";

async function fetchGeoapify(params: URLSearchParams): Promise<PlaceResult[]> {
  const key = KEY();
  if (!key) throw new Error("GEOAPIFY_API_KEY no configurada");
  params.set("apiKey", key);
  params.set("lang", "es");
  const res = await fetch(`${BASE}?${params.toString()}`, {
    // small edge cache; results are not user-specific
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Geoapify ${res.status}`);
  const data = await res.json();
  return (data.features ?? [])
    .map(normalizeFeature)
    .filter((r: PlaceResult | null): r is PlaceResult => !!r);
}

export async function geoapifySearch(opts: {
  query: string;
  lat?: number;
  lon?: number;
  limit?: number;
}): Promise<PlaceResult[]> {
  const lat = opts.lat ?? SEVILLE.lat;
  const lon = opts.lon ?? SEVILLE.lon;
  const params = new URLSearchParams({
    categories: CATERING_CATEGORIES.join(","),
    name: opts.query,
    // Places API needs a spatial filter; wide circle so name search dominates.
    filter: `circle:${lon},${lat},50000`,
    bias: `proximity:${lon},${lat}`,
    limit: String(Math.min(opts.limit ?? 10, 10)),
  });
  return fetchGeoapify(params);
}

export async function geoapifyNearby(opts: {
  lat: number;
  lon: number;
  radius?: number;
  limit?: number;
}): Promise<PlaceResult[]> {
  const radius = Math.min(opts.radius ?? 1500, 5000);
  const params = new URLSearchParams({
    categories: CATERING_CATEGORIES.join(","),
    filter: `circle:${opts.lon},${opts.lat},${radius}`,
    bias: `proximity:${opts.lon},${opts.lat}`,
    limit: String(Math.min(opts.limit ?? 20, 50)),
  });
  return fetchGeoapify(params);
}

// ---- tiny in-memory cache + rate limit (per server instance) ----
const cache = new Map<string, { at: number; data: PlaceResult[] }>();
const TTL = 60_000;

export function cacheGet(key: string): PlaceResult[] | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  return null;
}
export function cacheSet(key: string, data: PlaceResult[]) {
  cache.set(key, { at: Date.now(), data });
}

const hits = new Map<string, { at: number; n: number }>();
export function rateLimited(ip: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > windowMs) {
    hits.set(ip, { at: now, n: 1 });
    return false;
  }
  h.n++;
  return h.n > max;
}
