"use client";

import Link from "next/link";
import {
  getCurrentUser,
  getFollowingFeed,
  followingCount,
  useStore,
} from "@/lib/store";
import ReviewCard from "@/components/ReviewCard";
import ui from "@/components/ui.module.css";

export default function Following() {
  const ready = useStore();
  const me = getCurrentUser();

  if (!ready) return <div className={ui.empty}>Cargando…</div>;

  const feed = me ? getFollowingFeed(me.id) : [];
  const count = me ? followingCount(me.id) : 0;

  return (
    <div className={ui.screen}>
      <div className={ui.header}>
        <div className={ui.title}>Siguiendo</div>
      </div>

      {feed.length === 0 ? (
        <div className={ui.empty}>
          <strong>
            {count === 0 ? "Aún no sigues a nadie" : "Sin reseñas todavía"}
          </strong>
          {count === 0 ? (
            <>
              Sigue a foodies cuyo gusto te guste para ver aquí sus reseñas.{" "}
              <Link href="/search" style={{ color: "var(--accent)", fontWeight: 700 }}>
                Descubrir foodies
              </Link>
            </>
          ) : (
            "Las personas que sigues aún no han publicado reseñas."
          )}
        </div>
      ) : (
        <div className={ui.list}>
          {feed.map((r) => (
            <ReviewCard key={r.id} review={r} showPlace />
          ))}
        </div>
      )}
    </div>
  );
}
