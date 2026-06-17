"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getReviewById,
  getCurrentUser,
  getReviewsByUser,
  deleteReview,
  isFollowing,
  toggleFollow,
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
  const [photoIdx, setPhotoIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const review = getReviewById(id);

  if (!ready) return <div className={ui.empty}>Cargando…</div>;

  if (!review) {
    return (
      <div className={ui.screen}>
        <div className={ui.header}>
          <button className={ui.back} onClick={() => router.back()}>
            ←
          </button>
          <div className={ui.title}>Reseña</div>
        </div>
        <div className={ui.empty}>
          <strong>Reseña no encontrada</strong>
          Puede que se haya eliminado.
        </div>
      </div>
    );
  }

  const me = getCurrentUser();
  const { user, place } = review;
  const isOwner = me?.id === review.userId;
  const following = me ? isFollowing(me.id, user.id) : false;
  const reviewCount = getReviewsByUser(user.id).length;

  const photos = review.photos;
  const hasPhotos = photos.length > 0;
  const verdict = review.text.split(/(?<=[.!?])\s+/)[0];

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setPhotoIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${place.name} — Foody`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* dismissed */
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  const onDelete = async () => {
    if (confirm("¿Eliminar esta reseña?")) {
      await deleteReview(review.id);
      router.push(`/place/${place.id}`);
    }
  };

  return (
    <div className={`${ui.screen} ${styles.screen}`}>
      {/* 1. photo / hero */}
      <div className={styles.hero}>
        {hasPhotos ? (
          <div className={styles.track} ref={trackRef} onScroll={onScroll}>
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt="" className={styles.slide} />
            ))}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span>{CATEGORY_EMOJI[place.category]}</span>
          </div>
        )}

        <div className={styles.heroControls}>
          <button className={styles.iconBtn} onClick={() => router.back()}>
            ←
          </button>
          <button className={styles.iconBtn} onClick={share}>
            ↗
          </button>
        </div>

        {photos.length > 1 && (
          <>
            <div className={styles.counter}>
              {photoIdx + 1}/{photos.length}
            </div>
            <div className={styles.dots}>
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === photoIdx ? styles.dotOn : ""}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* sheet that overlaps the hero */}
      <div className={styles.sheet}>
        {/* 2. restaurant header */}
        <Link href={`/place/${place.id}`} className={styles.placeName}>
          {place.name}
        </Link>
        <div className={styles.placeMeta}>
          <span className={styles.cat}>
            {CATEGORY_EMOJI[place.category]} {place.category}
          </span>
          {(place.address || place.city) && (
            <>
              <span className={styles.metaDot}>·</span>
              <span>{place.address ?? place.city}</span>
            </>
          )}
        </div>

        {/* 3. quick verdict */}
        {verdict && (
          <div className={styles.verdict}>
            <span className={styles.quote}>“</span>
            {verdict}
          </div>
        )}

        {/* 4. quick stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statTop}>
              <Stars rating={review.rating} size={13} />
            </div>
            <div className={styles.statLabel}>{review.rating.toFixed(1)} valoración</div>
          </div>
          {review.pricePerPerson != null && (
            <div className={styles.stat}>
              <div className={styles.statTop}>€{review.pricePerPerson}</div>
              <div className={styles.statLabel}>por persona</div>
            </div>
          )}
          {review.dishes.length > 0 && (
            <div className={styles.stat}>
              <div className={styles.statTop}>{review.dishes.length}</div>
              <div className={styles.statLabel}>
                plato{review.dishes.length === 1 ? "" : "s"}
              </div>
            </div>
          )}
          {review.tags[0] && (
            <div className={styles.stat}>
              <div className={styles.statTop}>✦</div>
              <div className={styles.statLabel}>{review.tags[0]}</div>
            </div>
          )}
        </div>

        {/* 5. creator card */}
        <Link href={`/profile/${user.username}`} className={styles.creator}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
          <div className={styles.creatorInfo}>
            <div className={styles.creatorName}>{user.name}</div>
            <div className={styles.creatorSub}>
              @{user.username} · {reviewCount} reseña{reviewCount === 1 ? "" : "s"}
            </div>
            {user.bio && <div className={styles.creatorBio}>{user.bio}</div>}
          </div>
          {!isOwner &&
            (me ? (
              <button
                className={`${styles.followBtn} ${following ? styles.followingBtn : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleFollow(user.id);
                }}
              >
                {following ? "Siguiendo" : "Seguir"}
              </button>
            ) : (
              <span className={styles.followBtn}>Ver</span>
            ))}
        </Link>

        {/* 6. dishes */}
        {review.dishes.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Platos pedidos</h2>
            <div className={styles.chips}>
              {review.dishes.map((d) => (
                <span key={d} className={styles.chip}>
                  {d}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 7. written review */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Qué le pareció</h2>
          <p className={styles.text}>{review.text}</p>
          {review.tags.length > 0 && (
            <div className={styles.tags}>
              {review.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className={styles.date}>
            {new Date(review.createdAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {review.updatedAt !== review.createdAt && " · editado"}
          </div>
        </section>

        {/* 8. place info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dónde</h2>
          <div className={styles.placeInfo}>
            <div>
              <div className={styles.placeInfoName}>{place.name}</div>
              {place.address && (
                <div className={styles.placeInfoAddr}>
                  {place.address}, {place.city}
                </div>
              )}
            </div>
            <a
              className={styles.mapsLink}
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en mapas ↗
            </a>
          </div>
        </section>

        {isOwner && (
          <div className={styles.ownerActions}>
            <Link href={`/create?reviewId=${review.id}`} className={styles.edit}>
              Editar reseña
            </Link>
            <button onClick={onDelete} className={styles.deleteText}>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* 9. bottom CTA */}
      <div className={styles.cta}>
        <Link href={`/place/${place.id}`} className={styles.ctaPrimary}>
          Ver sitio
        </Link>
        <Link href={`/create?placeId=${place.id}`} className={styles.ctaSecondary}>
          Añadir la tuya
        </Link>
      </div>
    </div>
  );
}
