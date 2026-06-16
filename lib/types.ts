export type Review = {
  id: string;
  place: string;
  category: "food" | "coffee" | "bar" | "dessert" | "other";
  rating: number; // 1-5
  author: string;
  comment: string;
  emoji: string;
  photo?: string;
  lng: number;
  lat: number;
  createdAt: string; // ISO
};
