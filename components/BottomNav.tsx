"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, useStore } from "@/lib/store";
import styles from "./BottomNav.module.css";

const items = [
  { href: "/", label: "Map", icon: "🗺️", match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: "🔍", match: (p: string) => p.startsWith("/search") },
  { href: "/create", label: "Add", icon: "➕", match: (p: string) => p.startsWith("/create") },
];

export default function BottomNav() {
  const pathname = usePathname();
  useStore();
  const me = getCurrentUser();

  const tabs = [
    ...items,
    {
      href: me ? `/profile/${me.username}` : "/",
      label: "Profile",
      icon: "👤",
      match: (p: string) => p.startsWith("/profile"),
    },
  ];

  return (
    <nav className={styles.nav}>
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`${styles.tab} ${active ? styles.active : ""}`}
          >
            <span className={styles.icon}>{t.icon}</span>
            <span className={styles.label}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
