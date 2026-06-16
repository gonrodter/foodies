"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPlaceWithStats,
  getReviewsByPlace,
  useStore,
} from "@/lib/store";
import { CATEGORY_EMOJI } from "@/lib/types";
import Stars from "@/components/Stars";
import ReviewCard from "@/components/ReviewCard";
import ui from "@/components/ui.module.css";
import styles from "./place.module.css";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useStore();

  const place = getPlaceWithStats(id);

  if (!ready) {
    return <div className={ui.empty}>Loading…</div>;
  }

  if (!place) {
    return (
      <div className={ui.screen}>
        <div className={ui.header}>
          <button className={ui.back} onClick={() => router.back()}>
            ←
          </button>
          <div className={ui.title}>Place</div>
        </div>
        <div className={ui.empty}>
          <strong>Place not found</strong>
          It may have been removed.
        </div>
      </div>
    );
  }

  const reviews = getReviewsByPlace(place.id);
  const photos = place.photos;

  return (
    <div className={ui.screen}>
      <div className={styles.hero}>
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt={place.name} className={styles.heroImg} />
        ) : (
          <div className={styles.heroFallback}>
            {CATEGORY_EMOJI[place.category]}
          </div>
        )}
        <button className={styles.heroBack} onClick={() => router.back()}>
          ←
        </button>
      </div>

      <div className={styles.head}>
        <h1 className={styles.name}>{place.name}</h1>
        <div className={ui.metaRow}>
          <Stars rating={place.avgRating} size={16} />
          <span style={{ fontWeight: 800 }}>{place.avgRating.toFixed(1)}</span>
          <span className={ui.dot}>·</span>
          <span>
            {place.reviewCount} review{place.reviewCount === 1 ? "" : "s"}
          </span>
          {place.avgPrice != null && (
            <>
              <span className={ui.dot}>·</span>
              <span className={ui.price}>~€{place.avgPrice}/person</span>
            </>
          )}
        </div>
        {place.address && <div className={styles.addr}>📍 {place.address}, {place.city}</div>}

        <Link
          href={`/create?placeId=${place.id}`}
          className={styles.addReview}
        >
          + Add a review
        </Link>
      </div>

      {photos.length > 1 && (
        <div className={styles.gallery}>
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className={styles.galleryImg} />
          ))}
        </div>
      )}

      <h2 className={styles.section}>Reviews</h2>
      <div className={ui.list}>
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
