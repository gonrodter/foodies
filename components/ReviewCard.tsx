import Link from "next/link";
import { ReviewWithRefs, CATEGORY_EMOJI } from "@/lib/types";
import Stars from "./Stars";
import styles from "./ui.module.css";

type Props = { review: ReviewWithRefs; showPlace?: boolean };

export default function ReviewCard({ review, showPlace }: Props) {
  const { user, place } = review;
  return (
    <Link href={`/review/${review.id}`} className={styles.reviewCard}>
      <div className={styles.reviewTop}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={user.avatarUrl} alt={user.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.author}>{user.name}</div>
          <div className={styles.handle}>@{user.username}</div>
        </div>
        <Stars rating={review.rating} />
      </div>

      {showPlace && (
        <div className={styles.placeName} style={{ marginTop: 10 }}>
          {CATEGORY_EMOJI[place.category]} {place.name}
        </div>
      )}

      {review.photos.length > 0 && (
        <div className={styles.photoRow}>
          {review.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} className={styles.photo} src={p} alt="" />
          ))}
        </div>
      )}

      <div className={styles.reviewText}>{review.text}</div>

      {review.dishes.length > 0 && (
        <div className={styles.dishes}>🍴 {review.dishes.join(", ")}</div>
      )}

      <div className={styles.metaRow}>
        {review.pricePerPerson != null && (
          <span className={styles.price}>€{review.pricePerPerson}/persona</span>
        )}
        <span className={styles.dot}>·</span>
        <span>{new Date(review.createdAt).toLocaleDateString("es-ES")}</span>
      </div>

      {review.tags.length > 0 && (
        <div className={styles.tags}>
          {review.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
