"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addReviewForPlace,
  updateReview,
  getReviewById,
  getPlaceWithStats,
  useStore,
} from "@/lib/store";
import { Tag, TAGS } from "@/lib/types";
import PlaceSearch, { SelectedPlace } from "@/components/PlaceSearch";
import ui from "@/components/ui.module.css";
import styles from "./create.module.css";

function CreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  useStore();

  const editId = params.get("reviewId");
  const existing = editId ? getReviewById(editId) : undefined;
  const presetPlace = params.get("placeId")
    ? getPlaceWithStats(params.get("placeId")!)
    : undefined;

  // place fixed when editing or adding to a known place; otherwise pick via search
  const fixedPlace: SelectedPlace | undefined = existing
    ? { id: existing.place.id, name: existing.place.name, address: existing.place.address, city: existing.place.city }
    : presetPlace
    ? { id: presetPlace.id, name: presetPlace.name, address: presetPlace.address, city: presetPlace.city }
    : undefined;

  const [selected, setSelected] = useState<SelectedPlace | undefined>(fixedPlace);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [price, setPrice] = useState(
    existing?.pricePerPerson != null ? String(existing.pricePerPerson) : ""
  );
  const [dishes, setDishes] = useState(existing?.dishes.join(", ") ?? "");
  const [text, setText] = useState(existing?.text ?? "");
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [photoInput, setPhotoInput] = useState("");
  const [tags, setTags] = useState<Tag[]>(existing?.tags ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const placeLocked = !!fixedPlace;

  const toggleTag = (t: Tag) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const addPhoto = () => {
    const url = photoInput.trim();
    if (url) {
      setPhotos((p) => [...p, url]);
      setPhotoInput("");
    }
  };

  const submit = async () => {
    if (!selected) return setError("Elige un sitio.");
    if (rating < 1) return setError("Elige una valoración.");
    if (!text.trim()) return setError("Escribe una reseña corta.");

    const dishList = dishes
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const fields = {
      rating,
      pricePerPerson: price ? Number(price) : undefined,
      dishes: dishList,
      text: text.trim(),
      photos,
      tags,
    };

    setError("");
    setSaving(true);
    try {
      if (existing) {
        await updateReview(existing.id, fields);
        router.push(`/review/${existing.id}`);
      } else {
        const review = await addReviewForPlace(selected.id, fields);
        router.push(`/review/${review.id}`);
      }
    } catch (e) {
      setSaving(false);
      setError(
        e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <button className={ui.back} onClick={() => router.back()}>
          ←
        </button>
        <div className={ui.title}>{existing ? "Editar reseña" : "Nueva reseña"}</div>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Sitio</label>
        {placeLocked ? (
          <div className={styles.lockedPlace}>
            <span className={styles.lockedName}>{selected?.name}</span>
            {selected?.address && (
              <span className={styles.lockedAddr}>{selected.address}</span>
            )}
          </div>
        ) : selected ? (
          <div className={styles.lockedPlace}>
            <div>
              <span className={styles.lockedName}>{selected.name}</span>
              {selected.address && (
                <span className={styles.lockedAddr}>{selected.address}</span>
              )}
            </div>
            <button
              type="button"
              className={styles.changePlace}
              onClick={() => setSelected(undefined)}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <PlaceSearch onSelect={setSelected} />
        )}

        <label className={styles.label}>Valoración</label>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={styles.starBtn}
              onClick={() => setRating(n)}
              style={{ color: n <= rating ? "#f5a623" : "#d8dbe0" }}
            >
              ★
            </button>
          ))}
        </div>

        <label className={styles.label}>Precio por persona (€)</label>
        <input
          className={styles.input}
          placeholder="ej. 20"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className={styles.label}>Platos pedidos</label>
        <input
          className={styles.input}
          placeholder="Separados por comas, ej. Solomillo, Salmorejo"
          value={dishes}
          onChange={(e) => setDishes(e.target.value)}
        />

        <label className={styles.label}>Reseña</label>
        <textarea
          className={styles.textarea}
          placeholder="¿Qué te gustó?"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className={styles.label}>Fotos</label>
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="Pega la URL de una imagen"
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhoto())}
          />
          <button className={styles.addBtn} onClick={addPhoto} type="button">
            Añadir
          </button>
        </div>
        {photos.length > 0 && (
          <div className={styles.photoPreview}>
            {photos.map((p, i) => (
              <div key={i} className={styles.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className={styles.thumb} />
                <button
                  className={styles.remove}
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className={styles.label}>Etiquetas</label>
        <div className={styles.chips}>
          {TAGS.map((t) => (
            <button
              key={t}
              className={`${styles.chip} ${tags.includes(t) ? styles.chipOn : ""}`}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submit} onClick={submit} disabled={saving}>
          {saving ? "Guardando…" : existing ? "Guardar cambios" : "Publicar reseña"}
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className={ui.empty}>Cargando…</div>}>
      <CreateForm />
    </Suspense>
  );
}
