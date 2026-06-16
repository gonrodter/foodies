import dynamic from "next/dynamic";

// Map is client-only (needs window / WebGL).
const FoodMap = dynamic(() => import("@/components/FoodMap"), { ssr: false });

export default function Home() {
  return (
    <main>
      <FoodMap />
    </main>
  );
}
