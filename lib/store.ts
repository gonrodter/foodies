"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import {
  User,
  Place,
  Review,
  Follow,
  PlaceWithStats,
  ReviewWithRefs,
  Category,
  Tag,
  CATEGORY_EMOJI,
} from "./types";

// Supabase-backed store. Data is fetched once into an in-memory cache; sync
// getters read the cache so components stay simple (call a getter + useStore()
// to subscribe). Mutations write through to Supabase then patch the cache.

type DB = {
  users: User[];
  places: Place[];
  reviews: Review[];
  follows: Follow[];
};

const CURRENT_KEY = "foody.currentUser";
const empty: DB = { users: [], places: [], reviews: [], follows: [] };

let cache: DB = empty;
let ready = false;
let loadStarted = false;
let currentUserId: string | null = null;
let version = 0;

const listeners = new Set<() => void>();
const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

// ---- row mappers (snake_case -> camelCase) ----
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapUser = (r: any): User => ({
  id: r.id,
  name: r.name,
  username: r.username,
  avatarUrl: r.avatar_url ?? undefined,
  bio: r.bio ?? undefined,
  city: r.city ?? undefined,
  createdAt: r.created_at,
});
const mapPlace = (r: any): Place => ({
  id: r.id,
  name: r.name,
  address: r.address ?? undefined,
  city: r.city,
  lat: r.lat,
  lng: r.lng,
  category: r.category as Category,
  createdAt: r.created_at,
});
const mapReview = (r: any): Review => ({
  id: r.id,
  userId: r.user_id,
  placeId: r.place_id,
  rating: r.rating,
  pricePerPerson: r.price_per_person ?? undefined,
  dishes: r.dishes ?? [],
  text: r.text,
  photos: r.photos ?? [],
  tags: (r.tags ?? []) as Tag[],
  emoji: r.emoji ?? "📍",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const mapFollow = (r: any): Follow => ({
  followerId: r.follower_id,
  followingId: r.following_id,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- load ----
async function loadAll() {
  if (loadStarted) return;
  loadStarted = true;
  if (!supabase) {
    ready = true;
    notify();
    return;
  }
  const [u, p, r, f] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("places").select("*"),
    supabase.from("reviews").select("*"),
    supabase.from("follows").select("*"),
  ]);
  cache = {
    users: (u.data ?? []).map(mapUser),
    places: (p.data ?? []).map(mapPlace),
    reviews: (r.data ?? []).map(mapReview),
    follows: (f.data ?? []).map(mapFollow),
  };
  if (typeof window !== "undefined") {
    currentUserId = localStorage.getItem(CURRENT_KEY);
  }
  if (!currentUserId || !cache.users.some((x) => x.id === currentUserId)) {
    currentUserId = cache.users[0]?.id ?? null;
  }
  ready = true;
  notify();
}

const uidStr = () => Math.random().toString(36).slice(2, 10);

// ---- queries ----
export const isReady = () => ready;
export const isConfigured = () => !!supabase;

export const getCurrentUser = (): User | undefined =>
  cache.users.find((u) => u.id === currentUserId) ?? cache.users[0];

export const setCurrentUser = (userId: string) => {
  currentUserId = userId;
  if (typeof window !== "undefined") localStorage.setItem(CURRENT_KEY, userId);
  notify();
};

export const getUsers = (): User[] => cache.users;
export const getUserByUsername = (username: string) =>
  cache.users.find((u) => u.username === username);
export const getUserById = (id: string) => cache.users.find((u) => u.id === id);

function statsFor(place: Place): PlaceWithStats {
  const rs = cache.reviews.filter((r) => r.placeId === place.id);
  const ratings = rs.map((r) => r.rating);
  const prices = rs
    .map((r) => r.pricePerPerson)
    .filter((p): p is number => p != null);
  return {
    ...place,
    reviewCount: rs.length,
    avgRating: ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0,
    avgPrice: prices.length
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : undefined,
    photos: rs.flatMap((r) => r.photos),
  };
}

export const getPlacesWithStats = (): PlaceWithStats[] =>
  cache.places.map(statsFor).filter((p) => p.reviewCount > 0);

export const getPlaceWithStats = (id: string): PlaceWithStats | undefined => {
  const place = cache.places.find((p) => p.id === id);
  return place ? statsFor(place) : undefined;
};

const withRefs = (r: Review): ReviewWithRefs | undefined => {
  const place = cache.places.find((p) => p.id === r.placeId);
  const user = cache.users.find((u) => u.id === r.userId);
  if (!place || !user) return undefined;
  return { ...r, place, user };
};

export const getReviewsByPlace = (placeId: string): ReviewWithRefs[] =>
  cache.reviews
    .filter((r) => r.placeId === placeId)
    .map(withRefs)
    .filter((r): r is ReviewWithRefs => !!r)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getReviewsByUser = (userId: string): ReviewWithRefs[] =>
  cache.reviews
    .filter((r) => r.userId === userId)
    .map(withRefs)
    .filter((r): r is ReviewWithRefs => !!r)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// Feed of reviews from creators the user follows (most recent first).
export const getFollowingFeed = (userId: string): ReviewWithRefs[] => {
  const ids = new Set(
    cache.follows.filter((f) => f.followerId === userId).map((f) => f.followingId)
  );
  return cache.reviews
    .filter((r) => ids.has(r.userId))
    .map(withRefs)
    .filter((r): r is ReviewWithRefs => !!r)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getReviewById = (id: string): ReviewWithRefs | undefined => {
  const r = cache.reviews.find((x) => x.id === id);
  return r ? withRefs(r) : undefined;
};

export const searchPlaces = (query: string): PlaceWithStats[] => {
  const q = query.trim().toLowerCase();
  const all = getPlacesWithStats();
  if (!q) return all;
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.address ?? "").toLowerCase().includes(q)
  );
};

// ---- follow ----
export const isFollowing = (followerId: string, followingId: string) =>
  cache.follows.some(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
export const followerCount = (userId: string) =>
  cache.follows.filter((f) => f.followingId === userId).length;
export const followingCount = (userId: string) =>
  cache.follows.filter((f) => f.followerId === userId).length;

export const toggleFollow = async (followingId: string) => {
  const followerId = currentUserId;
  if (!followerId || followerId === followingId) return;
  const exists = isFollowing(followerId, followingId);
  if (exists) {
    cache.follows = cache.follows.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    );
    notify();
    await supabase
      ?.from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
  } else {
    cache.follows = [
      ...cache.follows,
      { followerId, followingId, createdAt: new Date().toISOString() },
    ];
    notify();
    await supabase
      ?.from("follows")
      .insert({ follower_id: followerId, following_id: followingId });
  }
};

// ---- review mutations ----
export type NewReviewInput = {
  placeName: string;
  address?: string;
  lat: number;
  lng: number;
  category: Category;
  rating: number;
  pricePerPerson?: number;
  dishes: string[];
  text: string;
  photos: string[];
  tags: Tag[];
};

async function ensurePlace(input: NewReviewInput): Promise<Place> {
  const found = cache.places.find(
    (p) => p.name.trim().toLowerCase() === input.placeName.trim().toLowerCase()
  );
  if (found) return found;

  const row = {
    name: input.placeName.trim(),
    address: input.address?.trim() || null,
    city: "Sevilla",
    lat: input.lat,
    lng: input.lng,
    category: input.category,
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("places")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    const place = mapPlace(data);
    cache.places = [...cache.places, place];
    return place;
  }
  const place: Place = {
    id: "p" + uidStr(),
    ...row,
    address: row.address ?? undefined,
    createdAt: new Date().toISOString(),
  };
  cache.places = [...cache.places, place];
  return place;
}

export const addReview = async (input: NewReviewInput): Promise<Review> => {
  if (!currentUserId) throw new Error("No current user");
  const place = await ensurePlace(input);
  const row = {
    user_id: currentUserId,
    place_id: place.id,
    rating: input.rating,
    price_per_person: input.pricePerPerson ?? null,
    dishes: input.dishes,
    text: input.text,
    photos: input.photos,
    tags: input.tags,
    emoji: CATEGORY_EMOJI[input.category],
  };
  let review: Review;
  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    review = mapReview(data);
  } else {
    const now = new Date().toISOString();
    review = {
      id: "r" + uidStr(),
      userId: currentUserId,
      placeId: place.id,
      rating: input.rating,
      pricePerPerson: input.pricePerPerson,
      dishes: input.dishes,
      text: input.text,
      photos: input.photos,
      tags: input.tags,
      emoji: CATEGORY_EMOJI[input.category],
      createdAt: now,
      updatedAt: now,
    };
  }
  cache.reviews = [...cache.reviews, review];
  notify();
  return review;
};

// Add a place row (from /api/places/upsert) into the cache if not present.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const cachePlace = (row: any): Place => {
  const existing = cache.places.find((p) => p.id === row.id);
  if (existing) return existing;
  const place = mapPlace(row);
  cache.places = [...cache.places, place];
  notify();
  return place;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ReviewFields = {
  rating: number;
  pricePerPerson?: number;
  dishes: string[];
  text: string;
  photos: string[];
  tags: Tag[];
};

// Create a review for an existing internal place (selected via Geoapify search).
export const addReviewForPlace = async (
  placeId: string,
  fields: ReviewFields
): Promise<Review> => {
  if (!currentUserId) throw new Error("No current user");
  const place = cache.places.find((p) => p.id === placeId);
  const emoji = CATEGORY_EMOJI[place?.category ?? "other"];
  const row = {
    user_id: currentUserId,
    place_id: placeId,
    rating: fields.rating,
    price_per_person: fields.pricePerPerson ?? null,
    dishes: fields.dishes,
    text: fields.text,
    photos: fields.photos,
    tags: fields.tags,
    emoji,
  };
  let review: Review;
  if (supabase) {
    const { data, error } = await supabase
      .from("reviews")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    review = mapReview(data);
  } else {
    const now = new Date().toISOString();
    review = {
      id: "r" + uidStr(),
      userId: currentUserId,
      placeId,
      rating: fields.rating,
      pricePerPerson: fields.pricePerPerson,
      dishes: fields.dishes,
      text: fields.text,
      photos: fields.photos,
      tags: fields.tags,
      emoji,
      createdAt: now,
      updatedAt: now,
    };
  }
  cache.reviews = [...cache.reviews, review];
  notify();
  return review;
};

export const updateReview = async (
  id: string,
  patch: Partial<NewReviewInput>
) => {
  const now = new Date().toISOString();
  cache.reviews = cache.reviews.map((r) =>
    r.id === id
      ? {
          ...r,
          rating: patch.rating ?? r.rating,
          pricePerPerson: patch.pricePerPerson ?? r.pricePerPerson,
          dishes: patch.dishes ?? r.dishes,
          text: patch.text ?? r.text,
          photos: patch.photos ?? r.photos,
          tags: patch.tags ?? r.tags,
          updatedAt: now,
        }
      : r
  );
  notify();
  await supabase
    ?.from("reviews")
    .update({
      rating: patch.rating,
      price_per_person: patch.pricePerPerson ?? null,
      dishes: patch.dishes,
      text: patch.text,
      photos: patch.photos,
      tags: patch.tags,
      updated_at: now,
    })
    .eq("id", id);
};

export const deleteReview = async (id: string) => {
  cache.reviews = cache.reviews.filter((r) => r.id !== id);
  notify();
  await supabase?.from("reviews").delete().eq("id", id);
};

// ---- React binding ----
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => version;
const getServerSnapshot = () => 0;

// Subscribe to the store and trigger the one-time load. Returns whether the
// initial fetch has completed, so components can show loading states.
export function useStore(): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    loadAll();
  }, []);
  return ready;
}
