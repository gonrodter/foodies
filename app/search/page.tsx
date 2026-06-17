"use client";

import { useState } from "react";
import { searchPlaces, useStore } from "@/lib/store";
import { Category, CATEGORY_EMOJI } from "@/lib/types";
import PlaceCard from "@/components/PlaceCard";
import ui from "@/components/ui.module.css";
import styles from "./search.module.css";

const CATEGORIES: Category[] = ["food", "coffee", "bar", "dessert", "other"];
const RATINGS = [0, 3, 4, 4.5];

export default function Search() {
  useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [minRating, setMinRating] = useState(0);

  let results = searchPlaces(q);
  if (cat) results = results.filter((p) => p.category === cat);
  if (minRating) results = results.filter((p) => p.avgRating >= minRating);
  results = results.sort((a, b) => b.avgRating - a.avgRating);

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
          <strong>Ningún sitio encontrado</strong>
          Prueba otra búsqueda o filtro.
        </div>
      ) : (
        <div className={ui.list}>
          {results.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </div>
  );
}
