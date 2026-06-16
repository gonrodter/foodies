"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getReviewById,
  getCurrentUser,
  deleteReview,
  useStore,
} from "@/lib/store";
import { CATEGORY_EMOJI } from "@/lib/types";
import Stars from "@/components/Stars";
import ui from "@/components/ui.module.css";
import styles from "./review.module.css";

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ready = useStore();

  const review = getReviewById(id);

  if (!ready) {
    return <div className={ui.empty}>Loading…</div>;
  }

  if (!review) {
    return (
      <div className={ui.screen}>
        <div className={ui.header}>
          <button className={ui.back} onClick={() => router.back()}>
            ←
          </button>
          <div className={ui.title}>Review</div>
        </div>
        <div className={ui.empty}>
          <strong>Review not found</strong>
          It may have been deleted.
        </div>
      </div>
    );
  }

  const me = getCurrentUser();
  const isOwner = me?.id === review.userId;
  const { user, place } = review;

  const onDelete = async () => {
    if (confirm("Delete this review?")) {
      await deleteReview(review.id);
      router.push(`/place/${place.id}`);
    }
  };

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <button className={ui.back} onClick={() => router.back()}>
          ←
        </button>
        <div className={ui.title}>Review</div>
      </div>

      <div className={styles.body}>
        <Link href={`/place/${place.id}`} className={styles.placeLink}>
          {CATEGORY_EMOJI[place.category]} {place.name}
        </Link>

        <div className={styles.ratingRow}>
          <Stars rating={review.rating} size={20} />
          <span className={styles.ratingNum}>{review.rating.toFixed(1)}</span>
          {review.pricePerPerson != null && (
            <span className={styles.price}>€{review.pricePerPerson}/person</span>
          )}
        </div>

        {review.photos.length > 0 && (
          <div className={styles.photoRow}>
            {review.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt="" className={styles.photo} />
            ))}
          </div>
        )}

        <p className={styles.text}>{review.text}</p>

        {review.dishes.length > 0 && (
          <div className={styles.block}>
            <div className={styles.label}>Dishes ordered</div>
            <div>{review.dishes.join(", ")}</div>
          </div>
        )}

        {review.tags.length > 0 && (
          <div className={ui.tags}>
            {review.tags.map((t) => (
              <span key={t} className={ui.tag}>
                {t}
              </span>
            ))}
          </div>
        )}

        <Link href={`/profile/${user.username}`} className={styles.creator}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
          <div>
            <div className={styles.creatorName}>{user.name}</div>
            <div className={styles.creatorHandle}>@{user.username}</div>
          </div>
          <span className={styles.viewProfile}>View profile →</span>
        </Link>

        <div className={styles.date}>
          Posted {new Date(review.createdAt).toLocaleDateString()}
          {review.updatedAt !== review.createdAt && " · edited"}
        </div>

        {isOwner && (
          <div className={styles.ownerActions}>
            <Link href={`/create?reviewId=${review.id}`} className={styles.edit}>
              Edit
            </Link>
            <button onClick={onDelete} className={styles.delete}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
