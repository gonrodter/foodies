"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchPlaces, cachePlace, useStore } from "@/lib/store";
import { Category, CATEGORY_EMOJI } from "@/lib/types";
import PlaceCard from "@/components/PlaceCard";
import type { PlaceResult } from "@/components/PlaceSearch";
import ui from "@/components/ui.module.css";
import styles from "./search.module.css";

const CATEGORIES: Category[] = ["food", "coffee", "bar", "dessert", "other"];
const RATINGS = [0, 3, 4, 4.5];
const SEVILLE = { lat: 37.3891, lon: -5.9845 };

export default function Search() {
  useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [minRating, setMinRating] = useState(0);

  const [nearby, setNearby] = useState<PlaceResult[]>([]);
  const [nearStatus, setNearStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [opening, setOpening] = useState(false);

  let results = searchPlaces(q);
  if (cat) results = results.filter((p) => p.category === cat);
  if (minRating) results = results.filter((p) => p.avgRating >= minRating);
  results = results.sort((a, b) => b.avgRating - a.avgRating);

  const searchHere = () => {
    setNearStatus("loading");
    const run = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`/api/places/nearby?lat=${lat}&lon=${lon}&radius=1500`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setNearby(data.results ?? []);
        setNearStatus("done");
      } catch {
        setNearStatus("error");
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => run(pos.coords.latitude, pos.coords.longitude),
        () => run(SEVILLE.lat, SEVILLE.lon),
        { timeout: 4000 }
      );
    } else {
      run(SEVILLE.lat, SEVILLE.lon);
    }
  };

  // Save the external place only on explicit interaction, then go review it.
  const openExternal = async (r: PlaceResult) => {
    setOpening(true);
    try {
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
      if (!res.ok) throw new Error(data.error);
      const place = cachePlace(data.place);
      router.push(`/create?placeId=${place.id}`);
    } catch {
      setNearStatus("error");
      setOpening(false);
    }
  };

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <div className={ui.title}>Descubre</div>
      </div>

      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Busca sitios o ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.chip} ${!cat ? styles.on : ""}`}
          onClick={() => setCat(null)}
        >
          Todo
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`${styles.chip} ${cat === c ? styles.on : ""}`}
            onClick={() => setCat(cat === c ? null : c)}
          >
            {CATEGORY_EMOJI[c]} {c}
          </button>
        ))}
      </div>
      <div className={styles.filters}>
        {RATINGS.map((r) => (
          <button
            key={r}
            className={`${styles.chip} ${minRating === r ? styles.on : ""}`}
            onClick={() => setMinRating(r)}
          >
            {r === 0 ? "Cualquiera" : `${r}★+`}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className={ui.empty}>
          <strong>Ningún sitio con reseñas</strong>
          Prueba otra búsqueda o explora sitios cerca.
        </div>
      ) : (
        <div className={ui.list}>
          {results.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}

      {/* nearby external places (Geoapify) */}
      <div className={styles.nearbyHead}>
        <span className={styles.nearbyTitle}>Sitios cerca</span>
        <button
          className={styles.zoneBtn}
          onClick={searchHere}
          disabled={nearStatus === "loading"}
        >
          {nearStatus === "loading" ? "Buscando…" : "Buscar en esta zona"}
        </button>
      </div>

      {nearStatus === "error" && (
        <div className={styles.nearError}>No se pudo buscar la zona.</div>
      )}
      {nearStatus === "done" && nearby.length === 0 && (
        <div className={ui.empty}>Sin sitios cerca.</div>
      )}

      {nearby.length > 0 && (
        <div className={ui.list}>
          {nearby.map((r) => (
            <button
              key={r.provider_place_id}
              className={styles.extCard}
              onClick={() => openExternal(r)}
              disabled={opening}
            >
              <div className={styles.extMain}>
                <span className={styles.extName}>{r.name}</span>
                <span className={styles.extTag}>externo</span>
              </div>
              <div className={styles.extAddr}>
                {[r.address_line1 || r.formatted_address, r.city]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {r.distance != null && (
                <div className={styles.extDist}>a {Math.round(r.distance)} m · aún sin reseñas</div>
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
