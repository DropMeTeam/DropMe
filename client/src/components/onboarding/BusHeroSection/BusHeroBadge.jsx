export default function BusHeroBadge({ text }) {
  return (
    <div className="bus-hero__badge">
      <span className="bus-hero__badgeIcon">🚌</span>
      <span>{text}</span>
    </div>
  );
}