"use client";

import { useParams } from "next/navigation";
import {
  getUserByUsername,
  getReviewsByUser,
  getCurrentUser,
  isFollowing,
  toggleFollow,
  followerCount,
  followingCount,
  getUsers,
  setCurrentUser,
  useStore,
} from "@/lib/store";
import ReviewCard from "@/components/ReviewCard";
import ui from "@/components/ui.module.css";
import styles from "./profile.module.css";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const ready = useStore();

  const user = getUserByUsername(username);
  const me = getCurrentUser();

  if (!ready) {
    return <div className={ui.empty}>Loading…</div>;
  }

  if (!user) {
    return (
      <div className={ui.screen}>
        <div className={ui.empty}>
          <strong>Creator not found</strong>@{username} doesn’t exist.
        </div>
      </div>
    );
  }

  const reviews = getReviewsByUser(user.id);
  const isMe = me?.id === user.id;
  const following = me ? isFollowing(me.id, user.id) : false;

  return (
    <div className={ui.screen}>
      <div className={styles.cover} />
      <div className={styles.head}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
        <h1 className={styles.name}>{user.name}</h1>
        <div className={styles.handle}>
          @{user.username}
          {user.city ? ` · ${user.city}` : ""}
        </div>
        {user.bio && <p className={styles.bio}>{user.bio}</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{reviews.length}</strong>
            <span>reviews</span>
          </div>
          <div className={styles.stat}>
            <strong>{followerCount(user.id)}</strong>
            <span>followers</span>
          </div>
          <div className={styles.stat}>
            <strong>{followingCount(user.id)}</strong>
            <span>following</span>
          </div>
        </div>

        {isMe ? (
          <label className={styles.switcher}>
            Viewing as
            <select
              value={me?.id ?? ""}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              {getUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button
            className={`${styles.follow} ${following ? styles.following : ""}`}
            onClick={() => toggleFollow(user.id)}
          >
            {following ? "Following ✓" : "+ Follow taste"}
          </button>
        )}
      </div>

      <h2 className={styles.section}>Places {user.name.split(" ")[0]} recommends</h2>
      {reviews.length === 0 ? (
        <div className={ui.empty}>No reviews yet.</div>
      ) : (
        <div className={ui.list}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} showPlace />
          ))}
        </div>
      )}
    </div>
  );
}
