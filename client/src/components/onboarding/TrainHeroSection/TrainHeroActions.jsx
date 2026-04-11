import { Link } from "react-router-dom";

export default function TrainHeroActions({
  primaryText,
  secondaryText,
  primaryTo,
  secondaryTo,
}) {
  return (
    <div className="train-hero__actions">
      <Link to={primaryTo} className="train-hero__btn train-hero__btn--primary">
        {primaryText}
      </Link>

      <Link
        to={secondaryTo}
        className="train-hero__btn train-hero__btn--secondary"
      >
        {secondaryText}
      </Link>
    </div>
  );
}