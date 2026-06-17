"use client";

import { useEffect, useRef, useState } from "react";
import { cachePlace } from "@/lib/store";
import styles from "./PlaceSearch.module.css";

export type PlaceResult = {
  id?: string;
  source: "local" | "geoapify";
  provider: "geoapify";
  provider_place_id: string;
  name: string;
  formatted_address: string;
  address_line1: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  categories: string[];
  distance?: number;
  raw_provider_data?: Record<string, unknown>;
};

export type SelectedPlace = { id: string; name: string; address?: string; city?: string };

type Props = { onSelect: (p: SelectedPlace) => void };

export default function PlaceSearch({ onSelect }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [picking, setPicking] = useState(false);
  const coords = useRef<{ lat: number; lon: number } | null>(null);

  // best-effort geolocation for proximity bias
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => (coords.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 3000 }
      );
    }
  }, []);

  // debounced search (400ms, min 3 chars)
  useEffect(() => {
    const query = q.trim();
    if (query.length < 3) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const t = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ query });
        if (coords.current) {
          p.set("lat", String(coords.current.lat));
          p.set("lon", String(coords.current.lon));
        }
        const res = await fetch(`/api/places/search?${p.toString()}`);
        const data = await res.json();
        if (!res.ok && !data.results) throw new Error(data.error ?? "error");
        setResults(data.results ?? []);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const choose = async (r: PlaceResult) => {
    setPicking(true);
    try {
      if (r.source === "local" && r.id) {
        onSelect({ id: r.id, name: r.name, address: r.formatted_address, city: r.city });
        return;
      }
      const res = await fetch("/api/places/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: r.provider,
          provider_place_id: r.provider_place_id,
          name: r.name,
          formatted_address: r.formatted_address,
          address_line1: r.address_line1,
          city: r.city,
          country: r.country,
          latitude: r.latitude,
          longitude: r.longitude,
          categories: r.categories,
          raw_provider_data: r.raw_provider_data,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upsert error");
      const place = cachePlace(data.place);
      onSelect({ id: place.id, name: place.name, address: place.address, city: place.city });
    } catch {
      setStatus("error");
    } finally {
      setPicking(false);
    }
  };

  const shortAddr = (r: PlaceResult) =>
    [r.address_line1 || r.formatted_address, r.city].filter(Boolean).join(" · ");

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        placeholder="¿Dónde has comido?"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {status === "loading" && <div className={styles.hint}>Buscando…</div>}
      {status === "error" && (
        <div className={styles.error}>No se pudo buscar. Inténtalo de nuevo.</div>
      )}
      {status === "done" && results.length === 0 && (
        <div className={styles.hint}>Sin resultados. Prueba otro nombre.</div>
      )}

      {results.length > 0 && (
        <div className={styles.list}>
          {results.map((r) => (
            <button
              key={`${r.source}-${r.id ?? r.provider_place_id}`}
              type="button"
              className={styles.item}
              onClick={() => choose(r)}
              disabled={picking}
            >
              <div className={styles.itemMain}>
                <span className={styles.name}>{r.name}</span>
                {r.source === "local" && <span className={styles.badge}>en la app</span>}
              </div>
              <div className={styles.addr}>{shortAddr(r)}</div>
              {r.distance != null && (
                <div className={styles.dist}>a {Math.round(r.distance)} m</div>
              )}
            </button>
          ))}
          <div className={styles.attrib}>
            © OpenStreetMap contributors · Powered by Geoapify
          </div>
        </div>
      )}
    </div>
  );
}
