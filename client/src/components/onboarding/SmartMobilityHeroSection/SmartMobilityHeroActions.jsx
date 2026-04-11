import { Link } from "react-router-dom";

export default function SmartMobilityHeroActions({
  primaryText,
  secondaryText,
  primaryTo,
  secondaryTo,
}) {
  return (
    <div className="smart-mobility-hero__actions">
      <Link
        to={primaryTo}
        className="smart-mobility-hero__btn smart-mobility-hero__btn--primary"
      >
        {primaryText}
      </Link>

      <Link
        to={secondaryTo}
        className="smart-mobility-hero__btn smart-mobility-hero__btn--secondary"
      >
        {secondaryText}
      </Link>
    </div>
  );
}