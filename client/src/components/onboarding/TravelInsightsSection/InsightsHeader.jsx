export default function InsightsHeader({ badge, title, description }) {
  return (
    <div className="travel-insights__header">
      <div className="travel-insights__badge">{badge}</div>
      <h2 className="travel-insights__title">{title}</h2>
      <p className="travel-insights__description">{description}</p>
    </div>
  );
}