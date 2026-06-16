type Props = { rating: number; size?: number };

// Read-only star display. Rounds to nearest half via filled count.
export default function Stars({ rating, size = 14 }: Props) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating.toFixed(1)} out of 5`}
      style={{ color: "#f5a623", fontSize: size, letterSpacing: 1 }}
    >
      {"★".repeat(full)}
      <span style={{ color: "#d8dbe0" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}
