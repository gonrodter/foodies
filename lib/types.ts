export type Category = "food" | "coffee" | "bar" | "dessert" | "other";

export const CATEGORY_EMOJI: Record<Category, string> = {
  food: "🍽️",
  coffee: "☕",
  bar: "🍷",
  dessert: "🍦",
  other: "📍",
};

export const TAGS = [
  "date night",
  "cheap eats",
  "brunch",
  "hidden gem",
  "good for groups",
] as const;
export type Tag = (typeof TAGS)[number];

export type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  createdAt: string;
};

export type Place = {
  id: string;
  name: string;
  address?: string;
  city: string;
  lat: number;
  lng: number;
  category: Category;
  createdAt: string;
};

export type Review = {
  id: string;
  userId: string;
  placeId: string;
  rating: number; // 1-5
  pricePerPerson?: number; // EUR
  dishes: string[];
  text: string;
  photos: string[];
  tags: Tag[];
  emoji: string;
  createdAt: string;
  updatedAt: string;
};

export type Follow = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

// Derived view models
export type PlaceWithStats = Place & {
  reviewCount: number;
  avgRating: number;
  avgPrice?: number;
  photos: string[];
};

export type ReviewWithRefs = Review & {
  place: Place;
  user: User;
};
