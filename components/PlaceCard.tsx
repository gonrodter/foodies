import Link from "next/link";
import { PlaceWithStats, CATEGORY_EMOJI } from "@/lib/types";
import Stars from "./Stars";
import styles from "./ui.module.css";

export default function PlaceCard({ place }: { place: PlaceWithStats }) {
  return (
    <Link href={`/place/${place.id}`} className={styles.placeCard}>
      {place.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.thumb} src={place.photos[0]} alt={place.name} />
      ) : (
        <div className={styles.thumb}>{CATEGORY_EMOJI[place.category]}</div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.placeName}>{place.name}</div>
        <div className={styles.metaRow}>
          <Stars rating={place.avgRating} />
          <span>{place.avgRating.toFixed(1)}</span>
          <span className={styles.dot}>·</span>
          <span>
            {place.reviewCount} reseña{place.reviewCount === 1 ? "" : "s"}
          </span>
          {place.avgPrice != null && (
            <>
              <span className={styles.dot}>·</span>
              <span className={styles.price}>~€{place.avgPrice}</span>
            </>
          )}
        </div>
        {place.address && <div className={styles.sub}>{place.address}</div>}
      </div>
    </Link>
  );
}
