import { Link } from "react-router-dom";

export default function PrivateRidePreviewCard({
  to,
  eyebrow,
  title,
  imageSrc,
  variant = "left",
}) {
  return (
    <Link
      to={to}
      className={`private-ride-card private-ride-card--${variant}`}
      aria-label={title}
    >
      <div className="private-ride-card__topGlow" aria-hidden="true" />

      <div className="private-ride-card__header">
        <p className="private-ride-card__eyebrow">{eyebrow}</p>
        <h3 className="private-ride-card__title">{title}</h3>
      </div>

      <div className="private-ride-card__imageWrap">
        <img
          src={imageSrc}
          alt={title}
          className="private-ride-card__image"
          loading="lazy"
        />
      </div>
    </Link>
  );
}