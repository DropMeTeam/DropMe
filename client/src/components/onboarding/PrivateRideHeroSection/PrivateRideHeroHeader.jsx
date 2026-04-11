export default function PrivateRideHeroHeader({ badge, title, description }) {
  return (
    <div className="private-ride-hero__header">
      <div className="private-ride-hero__badge">{badge}</div>

      <h2 className="private-ride-hero__title">{title}</h2>

      <p className="private-ride-hero__description">{description}</p>
    </div>
  );
}