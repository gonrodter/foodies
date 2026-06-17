"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, useStore } from "@/lib/store";
import styles from "./BottomNav.module.css";

// Minimal line icons (stroke = currentColor) for a clean, premium feel.
const Icon = ({ d }: { d: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {d.split("|").map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

const ICONS = {
  map: "M9 3 4 5.5v15l5-2.5 6 3 5-2.5v-15l-5 2.5-6-3Z|M9 3v15|M15 6v15",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|m15.5 8.5-2 5-5 2 2-5 5-2Z",
  heart:
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M5 20a7 7 0 0 1 14 0",
};

export default function BottomNav() {
  const pathname = usePathname();
  useStore();
  const me = getCurrentUser();

  const left = [
    { href: "/", label: "Mapa", icon: ICONS.map, match: (p: string) => p === "/" },
    {
      href: "/search",
      label: "Descubrir",
      icon: ICONS.compass,
      match: (p: string) => p.startsWith("/search"),
    },
  ];
  const right = [
    {
      href: "/following",
      label: "Siguiendo",
      icon: ICONS.heart,
      match: (p: string) => p.startsWith("/following"),
    },
    {
      href: me ? `/profile/${me.username}` : "/",
      label: "Perfil",
      icon: ICONS.user,
      match: (p: string) => p.startsWith("/profile"),
    },
  ];

  const Tab = (t: (typeof left)[number]) => {
    const active = t.match(pathname);
    return (
      <Link
        key={t.href}
        href={t.href}
        className={`${styles.tab} ${active ? styles.active : ""}`}
      >
        <Icon d={t.icon} />
        <span className={styles.label}>{t.label}</span>
      </Link>
    );
  };

  const createActive = pathname.startsWith("/create");

  return (
    <nav className={styles.nav}>
      <div className={styles.pill}>
        {left.map(Tab)}

        <Link
          href="/create"
          className={`${styles.create} ${createActive ? styles.createActive : ""}`}
          aria-label="Crear reseña"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>

        {right.map(Tab)}
      </div>
    </nav>
  );
}
