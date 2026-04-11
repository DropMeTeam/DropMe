import { Link } from "react-router-dom";

export default function BusHeroActions({
  primaryText,
  secondaryText,
  primaryTo,
  secondaryTo,
}) {
  return (
    <div className="bus-hero__actions">
      <Link to={primaryTo} className="bus-hero__btn bus-hero__btn--primary">
        {primaryText}
      </Link>

      <Link
        to={secondaryTo}
        className="bus-hero__btn bus-hero__btn--secondary"
      >
        {secondaryText}
      </Link>
    </div>
  );
}