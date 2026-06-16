"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addReview,
  updateReview,
  getReviewById,
  getPlaceWithStats,
  useStore,
} from "@/lib/store";
import { Category, Tag, TAGS, CATEGORY_EMOJI } from "@/lib/types";
import ui from "@/components/ui.module.css";
import styles from "./create.module.css";

const CATEGORIES: Category[] = ["food", "coffee", "bar", "dessert", "other"];
const SEVILLE = { lat: 37.3891, lng: -5.9845 };

function CreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  useStore();

  const editId = params.get("reviewId");
  const existing = editId ? getReviewById(editId) : undefined;
  const presetPlace = params.get("placeId")
    ? getPlaceWithStats(params.get("placeId")!)
    : undefined;

  const lockedPlace = existing?.place ?? presetPlace;

  const [placeName, setPlaceName] = useState(lockedPlace?.name ?? "");
  const [address, setAddress] = useState(lockedPlace?.address ?? "");
  const [lat, setLat] = useState(String(lockedPlace?.lat ?? SEVILLE.lat));
  const [lng, setLng] = useState(String(lockedPlace?.lng ?? SEVILLE.lng));
  const [category, setCategory] = useState<Category>(
    lockedPlace?.category ?? existing?.place.category ?? "food"
  );
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

  const placeLocked = !!lockedPlace;

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
    if (!placeName.trim()) return setError("Add a place name.");
    if (rating < 1) return setError("Pick a rating.");
    if (!text.trim()) return setError("Write a short review.");

    const dishList = dishes
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const priceNum = price ? Number(price) : undefined;

    setError("");
    setSaving(true);
    try {
      if (existing) {
        await updateReview(existing.id, {
          rating,
          pricePerPerson: priceNum,
          dishes: dishList,
          text: text.trim(),
          photos,
          tags,
        });
        router.push(`/review/${existing.id}`);
      } else {
        const review = await addReview({
          placeName,
          address,
          lat: Number(lat) || SEVILLE.lat,
          lng: Number(lng) || SEVILLE.lng,
          category,
          rating,
          pricePerPerson: priceNum,
          dishes: dishList,
          text: text.trim(),
          photos,
          tags,
        });
        router.push(`/review/${review.id}`);
      }
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    }
  };

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <button className={ui.back} onClick={() => router.back()}>
          ←
        </button>
        <div className={ui.title}>{existing ? "Edit review" : "New review"}</div>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>Place</label>
        <input
          className={styles.input}
          placeholder="Restaurant / place name"
          value={placeName}
          disabled={placeLocked}
          onChange={(e) => setPlaceName(e.target.value)}
        />

        {!placeLocked && (
          <>
            <input
              className={styles.input}
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Latitude"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Longitude"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
            <div className={styles.chips}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`${styles.chip} ${category === c ? styles.chipOn : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {CATEGORY_EMOJI[c]} {c}
                </button>
              ))}
            </div>
          </>
        )}

        <label className={styles.label}>Rating</label>
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

        <label className={styles.label}>Price per person (€)</label>
        <input
          className={styles.input}
          placeholder="e.g. 20"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className={styles.label}>Dishes ordered</label>
        <input
          className={styles.input}
          placeholder="Comma separated, e.g. Solomillo, Salmorejo"
          value={dishes}
          onChange={(e) => setDishes(e.target.value)}
        />

        <label className={styles.label}>Review</label>
        <textarea
          className={styles.textarea}
          placeholder="What made it good?"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <label className={styles.label}>Photos</label>
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="Paste image URL"
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhoto())}
          />
          <button className={styles.addBtn} onClick={addPhoto} type="button">
            Add
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

        <label className={styles.label}>Tags</label>
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
          {saving ? "Saving…" : existing ? "Save changes" : "Publish review"}
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className={ui.empty}>Loading…</div>}>
      <CreateForm />
    </Suspense>
  );
}
